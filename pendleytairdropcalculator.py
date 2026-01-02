import numpy as np

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


# =========================
# 🎯 CONFIGURATION SECTION - CHANGE YOUR VALUES HERE!
# =========================

# === GLOBAL PARAMETERS ===
AIRDROP_PCT = 0.10                    # 10% of total supply for airdrop (for the first season)
TOTAL_SUPPLY = 1_000_000_000          # Total token supply
POINTS_PROGRAM_DURATION_DAYS = 80    # Total duration of points program (from start to end)
NETWORK_POINTS_TOTAL = None           # Total network points (if None, will calculate from TVL/multipliers)
                                      # Set this if protocol announces total points directly
                                    

# === PROTOCOL TVL (Total Value Locked) ===
TVL_MODE = "average"                   # Options: "linear", "exp", "logistic", "average", "up_then_down", "down_then_up", "front_loaded", "back_loaded"
TVL_INITIAL = 20_000_000               # Starting TVL (not used if TVL_MODE="average")
TVL_FINAL = 20_000_000                 # Ending TVL (not used if TVL_MODE="average")
TVL_AVERAGE = 30_000_000               # Average TVL (only used if TVL_MODE="average")

# === PENDLE SHARE MODE ===
PENDLE_MODE = "by_tokens"              # Options: "simple" or "by_tokens"

# === PENDLE MARKETS START DAY ===
# If protocol's points program started before Pendle markets were created:
#   Set PENDLE_MARKETS_START_DAY to the day when Pendle markets launched
#   Days 0 to (PENDLE_MARKETS_START_DAY-1): Only direct staking earns points
#   Days PENDLE_MARKETS_START_DAY onwards: Both direct staking + Pendle YT earn points
# If Pendle markets existed from day 0, set to None or 0
PENDLE_MARKETS_START_DAY = None        # None or 0 = Pendle markets from day 0, or set to day number (e.g., 20)

# If PENDLE_MODE = "simple", configure these:
PENDLE_SHARE_INITIAL = 0.30            # Starting Pendle share (30%)
PENDLE_SHARE_FINAL = 0.30              # Ending Pendle share (30%)
PENDLE_SHARE_MODE = "linear"           # Options: "linear" or "average"
BASE_MULTIPLIER_PENDLE = 5.0           # Points multiplier for Pendle
BASE_MULTIPLIER_DIRECT = 1.0           # Points multiplier for direct holding

# If PENDLE_MODE = "by_tokens", configure TOKEN_CONFIGS:
# IMPORTANT: TVL values are in USD (price × amount)
# Points calculation for each token:
#   - YT on Pendle: TVL_YT_Pendle × mult_yt_pendle
#   - Direct staking: TVL_direct × mult_direct
# Note: PTs (Principal Tokens) don't earn points, so they're not included

# === COMPONENT TVL SCALING MODE ===
# How do component TVLs (YT on Pendle, direct staking) scale when total TVL changes?
# Options:
#   "proportional" - Components scale proportionally with total TVL (maintains shares)
#   "constant" - Components stay at absolute values (shares decrease as TVL grows)
#   "share_based" - Same as "proportional" (components maintain their share %)
COMPONENT_TVL_SCALING = "proportional"  # Options: "proportional", "constant"

TOKEN_CONFIGS = [
    {
        "name": "yzUSD",                # Token name (can be any name)
        "tvl_yt_pendle": 397_000,      # TVL of YT on Pendle (in USD)
        "tvl_direct": 873_000,         # TVL staked directly (not on Pendle, in USD)
        "mult_yt_pendle": 5.0,         # Multiplier for YT on Pendle
        "mult_direct": 1.0,            # Multiplier for direct staking
    },
    {
        "name": "syzUSD",               # Token name (can be any name)
        "tvl_yt_pendle": 202_000,      # TVL of YT on Pendle (in USD)
        "tvl_direct": 15_136_000,      # TVL staked directly (not on Pendle, in USD)
        "mult_yt_pendle": 1.0,          # Multiplier for YT on Pendle
        "mult_direct": 1.0,            # Multiplier for direct staking
    }
]

# === YOUR YT TOKEN HOLDINGS ===
USER_YT_TOKENS = [
    {
        "name": "yzUSD-YT",
        "initial_price": 0.03572,      # YT price at day 0
        "spend_usd": 1500,             # How much USD you're spending
        "multiplier": 5.0,             # Your points multiplier
        "entry_day": 3,                # Day you enter (will be overridden in timing sweep)
        
        # Campaign settings
        "campaign_enabled": False,     # Is there a campaign? True/False
        "campaign_end_day": 9,         # When does campaign end? (only if campaign_enabled=True)
        
        # YT Price decay mode
        "yt_price_mode": "linear_to_zero",  # Options: "linear_to_zero", "exp_to_zero", "stepwise_linear", "two_phase"
        "pre_mode": "flat",            # Before campaign ends (only if campaign_enabled=True)
        "post_mode": "exp_to_zero",    # After campaign ends (only if campaign_enabled=True)
        "post_discount": 0.30,         # Price drop at campaign end (only if campaign_enabled=True)
        "step_days": 7,                # Step size for stepwise_linear mode
    },
    # Add more tokens here if you have multiple YT positions
]

# === TIME WEIGHTING ===
TIME_WEIGHTING = True                  # True = early entry gets more points, False = all days equal

# === FDV SCENARIOS ===
FDV_LIST = [20_000_000, 50_000_000, 100_000_000, 200_000_000, 500_000_000]

# === TIMING SWEEP SETTINGS ===
RUN_TIMING_SWEEP = True                # Set to True to run timing sweep, False to skip
ENTRY_DAYS_TO_TEST = None              # None = test all days, or list like [0, 5, 10, 15]


# =========================
# 🔧 INTERNAL FUNCTIONS (DO NOT MODIFY BELOW)
# =========================

def _build_tvl_path(days, mode, tvl_initial, tvl_final, tvl_average=None):
    """Build a TVL path over time."""
    n = len(days)
    if n == 0:
        return np.array([], dtype=float)

    if mode == "average":
        if tvl_average is None:
            raise ValueError("tvl_average must be provided when tvl_mode='average'")
        return np.full(n, float(tvl_average))

    if n == 1:
        return np.full(n, float(tvl_initial))

    x = (days - days[0]) / max(days[-1] - days[0], 1)

    if mode == "linear":
        return tvl_initial + (tvl_final - tvl_initial) * x
    elif mode == "exp":
        if tvl_initial <= 0 or tvl_final <= 0:
            raise ValueError("For exp mode, tvl_initial and tvl_final must be > 0")
        b = np.log(tvl_final / tvl_initial)
        return tvl_initial * np.exp(b * x)
    elif mode == "logistic":
        L_low = tvl_initial
        L_high = tvl_final
        k = 8.0
        return L_low + (L_high - L_low) / (1.0 + np.exp(-k * (x - 0.5)))
    elif mode == "up_then_down":
        mid = 0.5
        left = x <= mid
        right = x > mid
        y = np.zeros_like(x, dtype=float)
        y[left] = tvl_initial + (tvl_final - tvl_initial) * (x[left] / mid)
        tvl_mid_down = (tvl_initial + tvl_final) / 2.0
        if np.any(right):
            xr = (x[right] - mid) / max(1e-9, 1 - mid)
            y[right] = tvl_final + (tvl_mid_down - tvl_final) * xr
        return y
    elif mode == "down_then_up":
        mid = 0.5
        left = x <= mid
        right = x > mid
        y = np.zeros_like(x, dtype=float)
        tvl_mid_low = min(tvl_initial, tvl_final) * 0.7
        y[left] = tvl_initial + (tvl_mid_low - tvl_initial) * (x[left] / mid)
        if np.any(right):
            xr = (x[right] - mid) / max(1e-9, 1 - mid)
            y[right] = tvl_mid_low + (tvl_final - tvl_mid_low) * xr
        return y
    elif mode == "front_loaded":
        return tvl_initial + (tvl_final - tvl_initial) * (1 - x**0.7)
    elif mode == "back_loaded":
        return tvl_initial + (tvl_final - tvl_initial) * (x**2)
    else:
        raise ValueError(f"Unknown tvl_mode '{mode}'")


def _build_pendle_share_path(days, mode, share_initial, share_final, share_average=None):
    """Build Pendle share path."""
    n = len(days)
    if n == 0:
        return np.array([], dtype=float)

    if mode == "average":
        val = share_average if share_average is not None else share_initial
        return np.full(n, float(val))

    if n == 1:
        return np.full(n, float(share_initial))

    x = (days - days[0]) / max(days[-1] - days[0], 1)
    return share_initial + (share_final - share_initial) * x


def _build_yt_price_path(
    days,
    mode,
    initial_price,
    final_epsilon=1e-4,
    step_days=7,
    campaign_enabled=False,
    campaign_end_day=None,
    pre_mode="flat",
    post_mode="linear_to_zero",
    post_discount=0.3,
):
    """Build a YT price path over time."""
    n = len(days)
    if n == 0:
        return np.array([], dtype=float)

    duration = max(days[-1] - days[0], 1)
    x = (days - days[0]) / duration

    if not campaign_enabled:
        if mode == "linear_to_zero":
            return initial_price * (1 - x)
        elif mode == "exp_to_zero":
            eps = final_epsilon
            b = np.log(eps / initial_price)
            return initial_price * np.exp(b * x)
        elif mode == "stepwise_linear":
            num_steps = max(1, int(np.ceil(duration / step_days)))
            step_indices = (days - days[0]) // step_days
            step_indices = np.clip(step_indices, 0, num_steps - 1)
            step_prices = initial_price * (1 - step_indices / num_steps)
            return step_prices
        else:
            raise ValueError(f"Unknown YT price mode '{mode}' without campaign")

    if mode != "two_phase":
        raise ValueError("For campaign_enabled=True, use mode='two_phase'")

    if campaign_end_day is None:
        raise ValueError("campaign_end_day must be provided when campaign_enabled=True")

    ce = int(campaign_end_day)
    ce = max(0, min(ce, days[-1]))
    price = np.zeros(n, dtype=float)

    pre_days = days <= ce
    x_pre = (days[pre_days] - days[0]) / max(ce - days[0], 1)
    if pre_mode == "flat":
        price[pre_days] = initial_price
    elif pre_mode == "slow_linear":
        price[pre_days] = initial_price * (1 - 0.1 * x_pre)
    elif pre_mode == "slow_exp":
        b_pre = np.log(0.9)
        price[pre_days] = initial_price * np.exp(b_pre * x_pre)
    else:
        raise ValueError(f"Unknown pre_mode '{pre_mode}'")

    p_ce = price[days == ce][-1] if np.any(days == ce) else initial_price
    p_post_start = p_ce * (1 - post_discount)

    post_days = days >= ce
    x_post = (days[post_days] - ce) / max(days[-1] - ce, 1)

    if post_mode == "linear_to_zero":
        price[post_days] = p_post_start * (1 - x_post)
    elif post_mode == "exp_to_zero":
        eps = final_epsilon
        b_post = np.log(eps / p_post_start)
        price[post_days] = p_post_start * np.exp(b_post * x_post)
    elif post_mode == "stepwise_linear":
        post_duration = days[-1] - ce
        num_steps = max(1, int(np.ceil(post_duration / step_days)))
        step_indices = (days[post_days] - ce) // step_days
        step_indices = np.clip(step_indices, 0, num_steps - 1)
        price[post_days] = p_post_start * (1 - step_indices / num_steps)
    else:
        raise ValueError(f"Unknown post_mode '{post_mode}'")

    return price


def simulate_airdrop_unified(
    airdrop_pct,
    total_supply,
    duration_days,
    tvl_mode,
    tvl_initial,
    tvl_final,
    tvl_average,
    pendle_mode,
    pendle_share_initial,
    pendle_share_final,
    pendle_share_mode,
    pendle_share_average,
    base_multiplier_pendle,
    base_multiplier_direct,
    token_configs,
    user_yt_tokens,
    time_weighting,
    fdv_list,
    network_points_total=None,
):
    """Unified airdrop simulation supporting multiple YT tokens."""
    if user_yt_tokens is None or len(user_yt_tokens) == 0:
        raise ValueError("user_yt_tokens must contain at least one token configuration")
    
    # If network_points_total is provided, use it directly
    # Otherwise, calculate from TVL and multipliers
    if network_points_total is not None and network_points_total > 0:
        network_points = float(network_points_total)
        # Still calculate avg_tvl and pendle_share_effective for display purposes
    days = np.arange(duration_days)
    tvl = _build_tvl_path(days, tvl_mode, tvl_initial, tvl_final, tvl_average)
    avg_tvl = float(tvl.mean())
    
    if pendle_mode == "simple":
        pendle_share_path = _build_pendle_share_path(
            days, pendle_share_mode,
            pendle_share_initial, pendle_share_final,
            pendle_share_average
        )
            pendle_share_effective = float(pendle_share_path.mean())
        elif pendle_mode == "by_tokens":
            if not token_configs:
                raise ValueError("token_configs must be provided when pendle_mode='by_tokens'")
            
            # Calculate effective Pendle share from token configs
            total_tvl_pendle = 0.0
            total_tvl_direct = 0.0
            
            for token_cfg in token_configs:
                total_tvl_pendle += float(token_cfg.get("tvl_yt_pendle", 0))
                total_tvl_direct += float(token_cfg.get("tvl_direct", 0))
            
            total_tvl_all = total_tvl_pendle + total_tvl_direct
            pendle_share_effective = total_tvl_pendle / total_tvl_all if total_tvl_all > 0 else 0.0
        else:
            pendle_share_effective = 0.0
    else:
        # Calculate network points from TVL and multipliers
        days = np.arange(duration_days)
        tvl = _build_tvl_path(days, tvl_mode, tvl_initial, tvl_final, tvl_average)
        avg_tvl = float(tvl.mean())
        
        if pendle_mode == "simple":
            # Get when Pendle markets started
            pendle_start_day = globals().get("PENDLE_MARKETS_START_DAY", None)
            if pendle_start_day is None:
                pendle_start_day = 0
            pendle_start_day = max(0, int(pendle_start_day))
            
            # Build Pendle share path only for days when Pendle markets exist
            # If Pendle starts later, the curve is calculated from Pendle start to end
            pendle_share_path = np.zeros_like(days, dtype=float)
            
            if pendle_start_day < duration_days:
                # Days when Pendle markets exist
                pendle_days = days[pendle_start_day:]
                if len(pendle_days) > 0:
                    # Build share path relative to Pendle start (0 to duration of Pendle markets)
                    pendle_share_values = _build_pendle_share_path(
                        pendle_days - pendle_start_day,  # Relative days (0 to pendle_duration)
                        pendle_share_mode,
                        pendle_share_initial, pendle_share_final,
                        pendle_share_average
                    )
                    pendle_share_path[pendle_start_day:] = pendle_share_values
            
            # Before Pendle markets start: only direct staking (Pendle share = 0)
            # From Pendle start day onwards: use calculated Pendle share
            net_mult_daily = np.zeros_like(days, dtype=float)
            for i, day in enumerate(days):
                if day < pendle_start_day:
                    # Before Pendle: only direct staking
                    net_mult_daily[i] = base_multiplier_direct
                else:
                    # After Pendle starts: weighted average
                    net_mult_daily[i] = (
                        pendle_share_path[i] * base_multiplier_pendle
                        + (1.0 - pendle_share_path[i]) * base_multiplier_direct
        )
            
        network_points_daily = tvl * net_mult_daily
        pendle_share_effective = float(pendle_share_path.mean())
    
    elif pendle_mode == "by_tokens":
        if not token_configs:
            raise ValueError("token_configs must be provided when pendle_mode='by_tokens'")
            
            # Get when Pendle markets started (if None or 0, they exist from day 0)
            pendle_start_day = globals().get("PENDLE_MARKETS_START_DAY", None)
            if pendle_start_day is None:
                pendle_start_day = 0
            pendle_start_day = max(0, int(pendle_start_day))
            
            # Calculate network points from each token's components
            # For each token: Points = (YT on Pendle × mult_yt_pendle) + (Direct × mult_direct)
            # All TVL values are in USD, so points are also in USD terms
            
            base_points_direct_only = 0.0  # Points from direct staking only
            base_points_with_pendle = 0.0  # Points from direct staking + Pendle YT
            total_tvl_pendle = 0.0
            total_tvl_direct = 0.0
            
            for token_cfg in token_configs:
                tvl_yt_pendle = float(token_cfg.get("tvl_yt_pendle", 0))
                tvl_direct = float(token_cfg.get("tvl_direct", 0))
                mult_yt_pendle = float(token_cfg.get("mult_yt_pendle", base_multiplier_pendle))
                mult_direct = float(token_cfg.get("mult_direct", base_multiplier_direct))
                
                # Direct staking points (available from day 0)
                base_points_direct_only += tvl_direct * mult_direct
                
                # Points with Pendle (direct + Pendle YT)
                base_points_with_pendle += tvl_yt_pendle * mult_yt_pendle
                base_points_with_pendle += tvl_direct * mult_direct
                
                # Track TVL for Pendle share calculation
                total_tvl_pendle += tvl_yt_pendle
                total_tvl_direct += tvl_direct
            
            # Total component TVL (points-earning TVL, excludes PTs)
            total_component_tvl = total_tvl_pendle + total_tvl_direct
            
            # Scale points based on COMPONENT_TVL_SCALING mode
            scaling_mode = globals().get("COMPONENT_TVL_SCALING", "proportional")
            
            # Calculate points for each day
            network_points_daily = np.zeros_like(tvl, dtype=float)
            
            for i, day in enumerate(days):
                # Before Pendle markets start: only direct staking points
                # From Pendle start day onwards: both direct + Pendle points
                if day < pendle_start_day:
                    base_points = base_points_direct_only
                else:
                    base_points = base_points_with_pendle
                
                # Scale by TVL if needed
                if avg_tvl > 0 and total_component_tvl > 0:
                    if scaling_mode == "proportional" or scaling_mode == "share_based":
                        network_points_daily[i] = (tvl[i] / avg_tvl) * base_points
                    elif scaling_mode == "constant":
                        network_points_daily[i] = base_points
                    else:
                        network_points_daily[i] = (tvl[i] / avg_tvl) * base_points
                else:
                    network_points_daily[i] = base_points
            
            # Calculate effective Pendle share for display
            total_tvl_all = total_tvl_pendle + total_tvl_direct
            pendle_share_effective = total_tvl_pendle / total_tvl_all if total_tvl_all > 0 else 0.0
    
    else:
        raise ValueError(f"Unknown pendle_mode '{pendle_mode}'")
    
    network_points = float(network_points_daily.sum())
    
    total_user_points = 0.0
    total_spent_usd = 0.0
    token_results = []
    
    for token_cfg in user_yt_tokens:
        name = token_cfg.get("name", "YT")
        initial_price = token_cfg["initial_price"]
        spend_usd = token_cfg["spend_usd"]
        multiplier = token_cfg["multiplier"]
        entry_day = token_cfg.get("entry_day", 0)
        
        campaign_enabled = token_cfg.get("campaign_enabled", False)
        yt_price_mode = token_cfg.get("yt_price_mode", "linear_to_zero")
        step_days = token_cfg.get("step_days", 7)
        
        if campaign_enabled:
            campaign_end_day = token_cfg.get("campaign_end_day")
            pre_mode = token_cfg.get("pre_mode", "flat")
            post_mode = token_cfg.get("post_mode", "linear_to_zero")
            post_discount = token_cfg.get("post_discount", 0.3)
            
            yt_prices = _build_yt_price_path(
                days,
                mode="two_phase",
                initial_price=initial_price,
                campaign_enabled=True,
                campaign_end_day=campaign_end_day,
                pre_mode=pre_mode,
                post_mode=post_mode,
                post_discount=post_discount,
                step_days=step_days,
            )
        else:
            yt_prices = _build_yt_price_path(
                days,
                mode=yt_price_mode,
                initial_price=initial_price,
                campaign_enabled=False,
                step_days=step_days,
            )
        
        entry_price = yt_prices[entry_day]
        user_yt = spend_usd / entry_price if entry_price > 0 else 0.0
        
        user_points_daily = np.zeros_like(days, dtype=float)
        active_mask = days >= entry_day
        base_daily_points = user_yt * multiplier
        
        if not time_weighting:
            user_points_daily[active_mask] = base_daily_points
        else:
            weights = (duration_days - days) / duration_days
            weights = np.clip(weights, 0.0, 1.0)
            user_points_daily[active_mask] = base_daily_points * weights[active_mask]
        
        user_points = float(user_points_daily.sum())
        total_user_points += user_points
        total_spent_usd += spend_usd
        
        token_results.append({
            "name": name,
            "spend_usd": spend_usd,
            "entry_day": entry_day,
            "entry_price": float(entry_price),
            "user_yt": float(user_yt),
            "user_points": user_points,
        })
    
    user_share = total_user_points / network_points if network_points > 0 else 0.0
    airdrop_tokens = float(total_supply * airdrop_pct)
    user_tokens = airdrop_tokens * user_share
    
    airdrop_values = {}
    roi_per_fdv = {}
    cost_vs_fdv = {}
    for fdv in fdv_list:
        token_price = fdv / total_supply
        value = user_tokens * token_price
        airdrop_values[fdv] = float(value)
        roi_per_fdv[fdv] = (
            (value - total_spent_usd) / total_spent_usd if total_spent_usd > 0 else None
        )
        cost_vs_fdv[fdv] = float(total_spent_usd / fdv)
    
    return {
        "user_points": total_user_points,
        "network_points": network_points,
        "user_share": user_share,
        "airdrop_tokens": airdrop_tokens,
        "user_tokens": user_tokens,
        "total_spent_usd": total_spent_usd,
        "token_results": token_results,
        "airdrop_values": airdrop_values,
        "roi_per_fdv": roi_per_fdv,
        "cost_vs_fdv": cost_vs_fdv,
        "avg_tvl": avg_tvl,
        "pendle_share_effective": pendle_share_effective,
    }


def timing_sweep_for_best_entry(
    airdrop_pct,
    total_supply,
    duration_days,
    tvl_mode,
    tvl_initial,
    tvl_final,
    tvl_average,
    pendle_mode,
    pendle_share_initial,
    pendle_share_final,
    pendle_share_mode,
    pendle_share_average,
    base_multiplier_pendle,
    base_multiplier_direct,
    token_configs,
    user_yt_tokens,
    time_weighting,
    fdv_list,
    entry_days,
    network_points_total=None,
):
    """Sweep entry days and compute ROI for each."""
    if not PANDAS_AVAILABLE:
        raise ImportError("pandas is required for timing_sweep_for_best_entry. Install with: pip install pandas")
    
    if user_yt_tokens is None or len(user_yt_tokens) == 0:
        raise ValueError("user_yt_tokens must contain at least one token configuration")
    
    # Always create days array (needed for token price paths)
    days = np.arange(duration_days)
    
    # If network_points_total is provided, use it directly
    # Otherwise, calculate from TVL and multipliers
    if network_points_total is not None and network_points_total > 0:
        network_points = float(network_points_total)
    else:
        # Calculate network points from TVL and multipliers
    tvl = _build_tvl_path(days, tvl_mode, tvl_initial, tvl_final, tvl_average)
    
    if pendle_mode == "simple":
            # Get when Pendle markets started
            pendle_start_day = globals().get("PENDLE_MARKETS_START_DAY", None)
            if pendle_start_day is None:
                pendle_start_day = 0
            pendle_start_day = max(0, int(pendle_start_day))
            
            # Build Pendle share path only for days when Pendle markets exist
            pendle_share_path = np.zeros_like(days, dtype=float)
            
            if pendle_start_day < duration_days:
                # Days when Pendle markets exist
                pendle_days = days[pendle_start_day:]
                if len(pendle_days) > 0:
                    # Build share path relative to Pendle start
                    pendle_share_values = _build_pendle_share_path(
                        pendle_days - pendle_start_day,
                        pendle_share_mode,
            pendle_share_initial, pendle_share_final,
            pendle_share_average
        )
                    pendle_share_path[pendle_start_day:] = pendle_share_values
            
            # Before Pendle markets start: only direct staking
            # From Pendle start day onwards: use calculated Pendle share
            net_mult_daily = np.zeros_like(days, dtype=float)
            for i, day in enumerate(days):
                if day < pendle_start_day:
                    net_mult_daily[i] = base_multiplier_direct
                else:
                    net_mult_daily[i] = (
                        pendle_share_path[i] * base_multiplier_pendle
                        + (1.0 - pendle_share_path[i]) * base_multiplier_direct
        )
        network_points_daily = tvl * net_mult_daily
    
    elif pendle_mode == "by_tokens":
        if not token_configs:
            raise ValueError("token_configs must be provided when pendle_mode='by_tokens'")
            
            # Get when Pendle markets started (same logic as simulate_airdrop_unified)
            pendle_start_day = globals().get("PENDLE_MARKETS_START_DAY", None)
            if pendle_start_day is None:
                pendle_start_day = 0
            pendle_start_day = max(0, int(pendle_start_day))
            
            # Calculate network points from each token's components (same logic as simulate_airdrop_unified)
            base_points_direct_only = 0.0
            base_points_with_pendle = 0.0
            total_component_tvl = 0.0
            
            for token_cfg in token_configs:
                tvl_yt_pendle = float(token_cfg.get("tvl_yt_pendle", 0))
                tvl_direct = float(token_cfg.get("tvl_direct", 0))
                mult_yt_pendle = float(token_cfg.get("mult_yt_pendle", base_multiplier_pendle))
                mult_direct = float(token_cfg.get("mult_direct", base_multiplier_direct))
                
                # Direct staking points (available from day 0)
                base_points_direct_only += tvl_direct * mult_direct
                
                # Points with Pendle (direct + Pendle YT)
                base_points_with_pendle += tvl_yt_pendle * mult_yt_pendle
                base_points_with_pendle += tvl_direct * mult_direct
                
                # Track total component TVL
                total_component_tvl += tvl_yt_pendle + tvl_direct
            
            avg_tvl = float(tvl.mean())
            scaling_mode = globals().get("COMPONENT_TVL_SCALING", "proportional")
            
            # Calculate points for each day
            network_points_daily = np.zeros_like(tvl, dtype=float)
            
            for i, day in enumerate(days):
                # Before Pendle markets start: only direct staking points
                # From Pendle start day onwards: both direct + Pendle points
                if day < pendle_start_day:
                    base_points = base_points_direct_only
                else:
                    base_points = base_points_with_pendle
                
                # Scale by TVL if needed
                if avg_tvl > 0 and total_component_tvl > 0:
                    if scaling_mode == "proportional" or scaling_mode == "share_based":
                        network_points_daily[i] = (tvl[i] / avg_tvl) * base_points
                    elif scaling_mode == "constant":
                        network_points_daily[i] = base_points
                    else:
                        network_points_daily[i] = (tvl[i] / avg_tvl) * base_points
                else:
                    network_points_daily[i] = base_points
    
    else:
        raise ValueError(f"Unknown pendle_mode '{pendle_mode}'")
    
    network_points = float(network_points_daily.sum())
    
    airdrop_tokens = float(total_supply * airdrop_pct)
    
    token_price_paths = []
    token_multipliers = []
    token_spend = []
    
    for token_cfg in user_yt_tokens:
        initial_price = token_cfg["initial_price"]
        spend_usd = token_cfg["spend_usd"]
        multiplier = token_cfg["multiplier"]
        
        campaign_enabled = token_cfg.get("campaign_enabled", False)
        yt_price_mode = token_cfg.get("yt_price_mode", "linear_to_zero")
        step_days = token_cfg.get("step_days", 7)
        
        if campaign_enabled:
            campaign_end_day = token_cfg.get("campaign_end_day")
            pre_mode = token_cfg.get("pre_mode", "flat")
            post_mode = token_cfg.get("post_mode", "linear_to_zero")
            post_discount = token_cfg.get("post_discount", 0.3)
            
            yt_prices = _build_yt_price_path(
                days,
                mode="two_phase",
                initial_price=initial_price,
                campaign_enabled=True,
                campaign_end_day=campaign_end_day,
                pre_mode=pre_mode,
                post_mode=post_mode,
                post_discount=post_discount,
                step_days=step_days,
            )
        else:
            yt_prices = _build_yt_price_path(
                days,
                mode=yt_price_mode,
                initial_price=initial_price,
                campaign_enabled=False,
                step_days=step_days,
            )
        
        token_price_paths.append(yt_prices)
        token_multipliers.append(multiplier)
        token_spend.append(spend_usd)
    
    total_spend = sum(token_spend)
    
    if entry_days is None:
        entry_days = list(range(duration_days))
    
    results = []
    
    for ed in entry_days:
        if ed < 0 or ed >= duration_days:
            continue
        
        total_user_points = 0.0
        total_yt_amount = 0.0
        avg_price = 0.0
        
        for i, (yt_prices, mult, spend) in enumerate(zip(token_price_paths, token_multipliers, token_spend)):
            price = yt_prices[ed]
            if price <= 0:
                continue
            user_yt = spend / price
            total_yt_amount += user_yt
            avg_price += price * spend / total_spend
            
            user_points_daily = np.zeros_like(days, dtype=float)
            active_mask = days >= ed
            base_daily_points = user_yt * mult
            
            if not time_weighting:
                user_points_daily[active_mask] = base_daily_points
            else:
                weights = (duration_days - days) / duration_days
                weights = np.clip(weights, 0.0, 1.0)
                user_points_daily[active_mask] = base_daily_points * weights[active_mask]
            
            total_user_points += float(user_points_daily.sum())
        
        user_share = total_user_points / network_points if network_points > 0 else 0.0
        user_tokens = airdrop_tokens * user_share
        
        for fdv in fdv_list:
            token_price = fdv / total_supply
            airdrop_value = user_tokens * token_price
            roi = (airdrop_value - total_spend) / total_spend if total_spend > 0 else None
            
            if user_tokens > 0 and token_price > 0 and avg_price > 0:
                breakeven_price = total_spend / (user_tokens * token_price / avg_price)
            else:
                breakeven_price = np.inf
            
            is_profitable = roi is not None and roi > 0
            
            future_days = days[ed:]
            future_profitable_count = 0
            for fd in future_days:
                avg_future_price = sum(
                    token_price_paths[i][fd] * token_spend[i] / total_spend
                    for i in range(len(token_price_paths))
                    if token_price_paths[i][fd] > 0
                )
                if avg_future_price < breakeven_price and avg_future_price > 0:
                    future_profitable_count += 1
            
            results.append({
                "entry_day": ed,
                "fdv": fdv,
                "yt_price_avg": avg_price,
                "user_yt_total": total_yt_amount,
                "user_share": user_share,
                "user_tokens": user_tokens,
                "airdrop_value": airdrop_value,
                "roi": roi,
                "breakeven_price": breakeven_price,
                "is_profitable": is_profitable,
                "future_profitable_days": future_profitable_count,
            })
    
    df = pd.DataFrame(results)
    df = df.set_index(["entry_day", "fdv"])
    
    return df


# =========================
# 🚀 MAIN EXECUTION
# =========================

if __name__ == "__main__":
    print("=" * 70)
    print("PENDLE YT AIRDROP CALCULATOR")
    print("=" * 70)
    
    # Run unified simulation
    print("\n📊 RUNNING AIRDROP SIMULATION...")
    if NETWORK_POINTS_TOTAL is not None:
        print(f"   Using provided network points total: {NETWORK_POINTS_TOTAL:,.0f}")
    else:
        print("   Calculating network points from TVL and multipliers...")
    result = simulate_airdrop_unified(
        airdrop_pct=AIRDROP_PCT,
        total_supply=TOTAL_SUPPLY,
        duration_days=POINTS_PROGRAM_DURATION_DAYS,
        tvl_mode=TVL_MODE,
        tvl_initial=TVL_INITIAL,
        tvl_final=TVL_FINAL,
        tvl_average=TVL_AVERAGE,
        pendle_mode=PENDLE_MODE,
        pendle_share_initial=PENDLE_SHARE_INITIAL,
        pendle_share_final=PENDLE_SHARE_FINAL,
        pendle_share_mode=PENDLE_SHARE_MODE,
        pendle_share_average=None,
        base_multiplier_pendle=BASE_MULTIPLIER_PENDLE,
        base_multiplier_direct=BASE_MULTIPLIER_DIRECT,
        token_configs=TOKEN_CONFIGS if PENDLE_MODE == "by_tokens" else None,
        user_yt_tokens=USER_YT_TOKENS,
        time_weighting=TIME_WEIGHTING,
        fdv_list=FDV_LIST,
        network_points_total=NETWORK_POINTS_TOTAL,
    )
    
    print(f"\n✅ RESULTS:")
    print(f"   Network points: {result['network_points']:,.0f}")
    print(f"   User share: {result['user_share']*100:.4f}%")
    print(f"   User tokens: {result['user_tokens']:,.2f}")
    print(f"   Total spent: ${result['total_spent_usd']:,.2f}")
    print(f"   Avg TVL: ${result['avg_tvl']:,.0f}")
    print(f"   Pendle share: {result['pendle_share_effective']*100:.2f}%")
    
    print("\n📦 YOUR TOKEN POSITIONS:")
    for token in result['token_results']:
        print(f"   {token['name']}: {token['user_yt']:,.2f} YT @ ${token['entry_price']:.4f} (Day {token['entry_day']})")
    
    print("\n💰 AIRDROP VALUES AT DIFFERENT FDVs:")
    for fdv, val in result["airdrop_values"].items():
        roi = result["roi_per_fdv"][fdv]
        print(f"   FDV ${fdv/1e6:.0f}M → ${val:,.2f} (ROI: {roi*100:.2f}%)")
    
    # Run timing sweep if enabled
    if RUN_TIMING_SWEEP:
        if not PANDAS_AVAILABLE:
            print("\n⚠️  TIMING SWEEP SKIPPED: pandas not installed")
            print("   Install with: pip install pandas")
        else:
            print("\n" + "=" * 70)
            print("🔍 RUNNING TIMING SWEEP...")
            print("=" * 70)
            
            sweep_df = timing_sweep_for_best_entry(
                airdrop_pct=AIRDROP_PCT,
                total_supply=TOTAL_SUPPLY,
                duration_days=POINTS_PROGRAM_DURATION_DAYS,
                tvl_mode=TVL_MODE,
                tvl_initial=TVL_INITIAL,
                tvl_final=TVL_FINAL,
                tvl_average=TVL_AVERAGE,
                pendle_mode=PENDLE_MODE,
                pendle_share_initial=PENDLE_SHARE_INITIAL,
                pendle_share_final=PENDLE_SHARE_FINAL,
                pendle_share_mode=PENDLE_SHARE_MODE,
                pendle_share_average=None,
                base_multiplier_pendle=BASE_MULTIPLIER_PENDLE,
                base_multiplier_direct=BASE_MULTIPLIER_DIRECT,
                token_configs=TOKEN_CONFIGS if PENDLE_MODE == "by_tokens" else None,
                user_yt_tokens=USER_YT_TOKENS,
                time_weighting=TIME_WEIGHTING,
                fdv_list=FDV_LIST,
                entry_days=ENTRY_DAYS_TO_TEST,
                network_points_total=NETWORK_POINTS_TOTAL,
            )
            
            # Show results for each FDV
            for target_fdv in FDV_LIST:
                print(f"\n📈 TOP 5 ENTRY DAYS FOR FDV ${target_fdv/1e6:.0f}M:")
                try:
                    fdv_slice = sweep_df.xs(target_fdv, level="fdv")
                    top5 = fdv_slice.nlargest(5, "roi")
                    
                    print(f"{'Day':<6} {'YT Price':<12} {'ROI':<12} {'Profitable?':<12} {'Future Days':<15}")
                    print("-" * 70)
                    for idx, row in top5.iterrows():
                        print(f"{idx:<6} ${row['yt_price_avg']:<11.5f} {row['roi']*100:<11.2f}% {'Yes' if row['is_profitable'] else 'No':<12} {row['future_profitable_days']:<15}")
                    
                    # Breakeven analysis
                    if len(top5) > 0:
                        breakeven = top5.iloc[0]["breakeven_price"]
                        profitable_count = len(fdv_slice[fdv_slice["is_profitable"]])
                        print(f"\n   💡 Breakeven YT price: ${breakeven:.5f}")
                        print(f"   📊 Profitable entry days: {profitable_count}/{len(fdv_slice)}")
                except KeyError:
                    print(f"   No data available for FDV ${target_fdv/1e6:.0f}M")
            
            print("\n💾 Full timing sweep data saved in 'sweep_df' variable")
            print("   Access with: sweep_df.xs(100_000_000, level='fdv') for FDV $100M")
    
    print("\n" + "=" * 70)
    print("✅ CALCULATION COMPLETE!")
    print("=" * 70)