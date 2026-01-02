// Pendle YT Airdrop Calculator - Core Calculation Logic
// Ported from Python to JavaScript

class PendleCalculator {
    constructor() {
        // Helper functions
    }

    // Build TVL path over time
    buildTvlPath(days, mode, tvlInitial, tvlFinal, tvlAverage = null) {
        const n = days.length;
        if (n === 0) return [];

        if (mode === "average") {
            if (tvlAverage === null) {
                throw new Error("tvl_average must be provided when tvl_mode='average'");
            }
            return new Array(n).fill(parseFloat(tvlAverage));
        }

        if (n === 1) {
            return [parseFloat(tvlInitial)];
        }

        const x = days.map(d => (d - days[0]) / Math.max(days[days.length - 1] - days[0], 1));

        if (mode === "linear") {
            return x.map(xi => tvlInitial + (tvlFinal - tvlInitial) * xi);
        } else if (mode === "exp") {
            if (tvlInitial <= 0 || tvlFinal <= 0) {
                throw new Error("For exp mode, tvl_initial and tvl_final must be > 0");
            }
            const b = Math.log(tvlFinal / tvlInitial);
            return x.map(xi => tvlInitial * Math.exp(b * xi));
        } else if (mode === "logistic") {
            const L_low = tvlInitial;
            const L_high = tvlFinal;
            const k = 8.0;
            return x.map(xi => L_low + (L_high - L_low) / (1.0 + Math.exp(-k * (xi - 0.5))));
        } else if (mode === "up_then_down") {
            const mid = 0.5;
            return x.map(xi => {
                if (xi <= mid) {
                    return tvlInitial + (tvlFinal - tvlInitial) * (xi / mid);
                } else {
                    const tvl_mid_down = (tvlInitial + tvlFinal) / 2.0;
                    const xr = (xi - mid) / Math.max(1e-9, 1 - mid);
                    return tvlFinal + (tvl_mid_down - tvlFinal) * xr;
                }
            });
        } else if (mode === "down_then_up") {
            const mid = 0.5;
            const tvl_mid_low = Math.min(tvlInitial, tvlFinal) * 0.7;
            return x.map(xi => {
                if (xi <= mid) {
                    return tvlInitial + (tvl_mid_low - tvlInitial) * (xi / mid);
                } else {
                    const xr = (xi - mid) / Math.max(1e-9, 1 - mid);
                    return tvl_mid_low + (tvlFinal - tvl_mid_low) * xr;
                }
            });
        } else if (mode === "front_loaded") {
            return x.map(xi => tvlInitial + (tvlFinal - tvlInitial) * (1 - Math.pow(xi, 0.7)));
        } else if (mode === "back_loaded") {
            return x.map(xi => tvlInitial + (tvlFinal - tvlInitial) * Math.pow(xi, 2));
        } else {
            throw new Error(`Unknown tvl_mode '${mode}'`);
        }
    }

    // Build Pendle share path
    buildPendleSharePath(days, mode, shareInitial, shareFinal, shareAverage = null) {
        const n = days.length;
        if (n === 0) return [];

        if (mode === "average") {
            const val = shareAverage !== null ? shareAverage : shareInitial;
            return new Array(n).fill(parseFloat(val));
        }

        if (n === 1) {
            return [parseFloat(shareInitial)];
        }

        const x = days.map(d => (d - days[0]) / Math.max(days[days.length - 1] - days[0], 1));
        return x.map(xi => shareInitial + (shareFinal - shareInitial) * xi);
    }

    // Build YT price path
    buildYtPricePath(days, mode, initialPrice, finalEpsilon = 1e-4, stepDays = 7,
                     campaignEnabled = false, campaignEndDay = null,
                     preMode = "flat", postMode = "linear_to_zero", postDiscount = 0.3) {
        const n = days.length;
        if (n === 0) return [];

        const duration = Math.max(days[days.length - 1] - days[0], 1);
        const x = days.map(d => (d - days[0]) / duration);

        if (!campaignEnabled) {
            if (mode === "linear_to_zero") {
                return x.map(xi => initialPrice * (1 - xi));
            } else if (mode === "exp_to_zero") {
                const eps = finalEpsilon;
                const b = Math.log(eps / initialPrice);
                return x.map(xi => initialPrice * Math.exp(b * xi));
            } else if (mode === "stepwise_linear") {
                const numSteps = Math.max(1, Math.ceil(duration / stepDays));
                return days.map(day => {
                    const stepIndex = Math.min(Math.floor((day - days[0]) / stepDays), numSteps - 1);
                    return initialPrice * (1 - stepIndex / numSteps);
                });
            } else {
                throw new Error(`Unknown YT price mode '${mode}' without campaign`);
            }
        }

        if (mode !== "two_phase") {
            throw new Error("For campaign_enabled=true, use mode='two_phase'");
        }

        if (campaignEndDay === null) {
            throw new Error("campaign_end_day must be provided when campaign_enabled=true");
        }

        const ce = Math.max(0, Math.min(Math.floor(campaignEndDay), days[days.length - 1]));
        const price = new Array(n).fill(0);

        // Pre-campaign phase
        const preDays = days.filter(d => d <= ce);
        const preIndices = days.map((d, i) => d <= ce ? i : -1).filter(i => i >= 0);
        
        if (preDays.length > 0) {
            const xPre = preDays.map(d => (d - days[0]) / Math.max(ce - days[0], 1));
            if (preMode === "flat") {
                preIndices.forEach((idx, i) => {
                    price[idx] = initialPrice;
                });
            } else if (preMode === "slow_linear") {
                preIndices.forEach((idx, i) => {
                    price[idx] = initialPrice * (1 - 0.1 * xPre[i]);
                });
            } else if (preMode === "slow_exp") {
                const bPre = Math.log(0.9);
                preIndices.forEach((idx, i) => {
                    price[idx] = initialPrice * Math.exp(bPre * xPre[i]);
                });
            }
        }

        const pCe = price[days.indexOf(ce)] || initialPrice;
        const pPostStart = pCe * (1 - postDiscount);

        // Post-campaign phase
        const postDays = days.filter(d => d >= ce);
        const postIndices = days.map((d, i) => d >= ce ? i : -1).filter(i => i >= 0);
        
        if (postDays.length > 0) {
            const xPost = postDays.map(d => (d - ce) / Math.max(days[days.length - 1] - ce, 1));
            
            if (postMode === "linear_to_zero") {
                postIndices.forEach((idx, i) => {
                    price[idx] = pPostStart * (1 - xPost[i]);
                });
            } else if (postMode === "exp_to_zero") {
                const eps = finalEpsilon;
                const bPost = Math.log(eps / pPostStart);
                postIndices.forEach((idx, i) => {
                    price[idx] = pPostStart * Math.exp(bPost * xPost[i]);
                });
            } else if (postMode === "stepwise_linear") {
                const postDuration = days[days.length - 1] - ce;
                const numSteps = Math.max(1, Math.ceil(postDuration / stepDays));
                postIndices.forEach((idx, i) => {
                    const day = days[idx];
                    const stepIndex = Math.min(Math.floor((day - ce) / stepDays), numSteps - 1);
                    price[idx] = pPostStart * (1 - stepIndex / numSteps);
                });
            }
        }

        return price;
    }

    // Simulate airdrop (main calculation function)
    simulateAirdropUnified(config) {
        const {
            airdropPct,
            totalSupply,
            durationDays,
            tvlMode,
            tvlInitial,
            tvlFinal,
            tvlAverage,
            pendleMode,
            pendleShareInitial,
            pendleShareFinal,
            pendleShareAverage,
            pendleShareMode,
            baseMultiplierPendle,
            baseMultiplierDirect,
            tokenConfigs,
            userYtTokens,
            timeWeighting,
            fdvList,
            networkPointsTotal,
            componentTvlScaling
        } = config;

        if (!userYtTokens || userYtTokens.length === 0) {
            throw new Error("user_yt_tokens must contain at least one token configuration");
        }

        const days = Array.from({ length: durationDays }, (_, i) => i);
        let networkPoints;
        let avgTvl;
        let pendleShareEffective;

        // Determine calculation mode: proportional allocation (if networkPointsTotal provided) or TVL-generated
        const useProportionalAllocation = networkPointsTotal !== null && networkPointsTotal > 0;
        
        if (useProportionalAllocation) {
            // Proportional allocation mode (Kinetiq-style): Fixed network points distributed proportionally
            networkPoints = parseFloat(networkPointsTotal);
        } else {
            // Calculate network points from TVL and multipliers
            const tvl = this.buildTvlPath(days, tvlMode, tvlInitial, tvlFinal, tvlAverage);
            avgTvl = tvl.reduce((a, b) => a + b, 0) / tvl.length;
            let networkPointsDaily;

            if (pendleMode === "simple") {
                const pendleSharePath = this.buildPendleSharePath(
                    days, pendleShareMode,
                    pendleShareInitial || 0, pendleShareFinal || 0, pendleShareAverage
                );

                const netMultDaily = days.map((day, i) => {
                    return pendleSharePath[i] * baseMultiplierPendle +
                           (1.0 - pendleSharePath[i]) * baseMultiplierDirect;
                });

                networkPointsDaily = tvl.map((t, i) => t * netMultDaily[i]);
                pendleShareEffective = pendleSharePath.reduce((a, b) => a + b, 0) / pendleSharePath.length;
            } else if (pendleMode === "by_tokens") {
                if (!tokenConfigs || tokenConfigs.length === 0) {
                    throw new Error("token_configs must be provided when pendle_mode='by_tokens'");
                }

                let basePointsDirectOnly = 0;
                let basePointsWithPendle = 0;
                let totalTvlPendle = 0;
                let totalTvlDirect = 0;

                tokenConfigs.forEach(tokenCfg => {
                    const tvlYtPendle = parseFloat(tokenCfg.tvl_yt_pendle || 0);
                    const tvlDirect = parseFloat(tokenCfg.tvl_direct || 0);
                    const multYtPendle = parseFloat(tokenCfg.mult_yt_pendle || baseMultiplierPendle);
                    const multDirect = parseFloat(tokenCfg.mult_direct || baseMultiplierDirect);

                    basePointsDirectOnly += tvlDirect * multDirect;
                    basePointsWithPendle += tvlYtPendle * multYtPendle;
                    basePointsWithPendle += tvlDirect * multDirect;

                    totalTvlPendle += tvlYtPendle;
                    totalTvlDirect += tvlDirect;
                });

                const totalComponentTvl = totalTvlPendle + totalTvlDirect;
                const scalingMode = componentTvlScaling || "proportional";

                networkPointsDaily = days.map((day, i) => {
                    const basePoints = basePointsWithPendle;
                    
                    if (avgTvl > 0 && totalComponentTvl > 0) {
                        if (scalingMode === "proportional" || scalingMode === "share_based") {
                            return (tvl[i] / avgTvl) * basePoints;
                        } else if (scalingMode === "constant") {
                            return basePoints;
                        }
                    }
                    return basePoints;
                });

                const totalTvlAll = totalTvlPendle + totalTvlDirect;
                pendleShareEffective = totalTvlAll > 0 ? totalTvlPendle / totalTvlAll : 0;
            } else {
                throw new Error(`Unknown pendle_mode '${pendleMode}'`);
            }

            networkPoints = networkPointsDaily.reduce((a, b) => a + b, 0);
        }

        // Calculate TVL path and effective multipliers for both modes
        const tvl = this.buildTvlPath(days, tvlMode, tvlInitial, tvlFinal, tvlAverage);
        avgTvl = tvl.reduce((a, b) => a + b, 0) / tvl.length;

        // Calculate user weighted contribution and network weighted contribution
        let totalUserWeightedContribution = 0;
        let totalNetworkWeightedContribution = 0;
        let totalSpentUsd = 0;
        const tokenResults = [];

        // Calculate user's weighted contribution
        userYtTokens.forEach(tokenCfg => {
            const name = tokenCfg.name || "YT";
            const initialPrice = parseFloat(tokenCfg.initial_price);
            const spendUsd = parseFloat(tokenCfg.spend_usd);
            const multiplier = parseFloat(tokenCfg.multiplier);
            const entryDay = parseInt(tokenCfg.entry_day || 0);

            const campaignEnabled = tokenCfg.campaign_enabled || false;
            const ytPriceMode = tokenCfg.yt_price_mode || "linear_to_zero";
            const stepDays = parseInt(tokenCfg.step_days || 7);

            let ytPrices;
            if (campaignEnabled) {
                const campaignEndDay = parseInt(tokenCfg.campaign_end_day);
                const preMode = tokenCfg.pre_mode || "flat";
                const postMode = tokenCfg.post_mode || "linear_to_zero";
                const postDiscount = parseFloat(tokenCfg.post_discount || 0.3);

                ytPrices = this.buildYtPricePath(
                    days, "two_phase", initialPrice, 1e-4, stepDays,
                    true, campaignEndDay, preMode, postMode, postDiscount
                );
            } else {
                ytPrices = this.buildYtPricePath(
                    days, ytPriceMode, initialPrice, 1e-4, stepDays,
                    false, null, "flat", "linear_to_zero", 0.3
                );
            }

            const entryPrice = ytPrices[entryDay];
            const userYt = entryPrice > 0 ? spendUsd / entryPrice : 0;

            // Calculate user's weighted contribution (YT amount × multiplier × days held)
            let userWeightedContribution = 0;
            days.forEach((day, i) => {
                if (day >= entryDay) {
                    const daysHeld = durationDays - day; // Days remaining from this day
                    if (timeWeighting) {
                        const weight = Math.max(0, Math.min(1, (durationDays - day) / durationDays));
                        userWeightedContribution += userYt * multiplier * weight * daysHeld;
                    } else {
                        userWeightedContribution += userYt * multiplier * daysHeld;
                    }
                }
            });

            totalUserWeightedContribution += userWeightedContribution;
            totalSpentUsd += spendUsd;

            // For display purposes, also calculate user points (for TVL mode or display)
            const userPointsDaily = new Array(durationDays).fill(0);
            const activeMask = days.map(d => d >= entryDay);

            if (!timeWeighting) {
                activeMask.forEach((active, i) => {
                    if (active) userPointsDaily[i] = userYt * multiplier;
                });
            } else {
                const weights = days.map(d => Math.max(0, Math.min(1, (durationDays - d) / durationDays)));
                activeMask.forEach((active, i) => {
                    if (active) userPointsDaily[i] = userYt * multiplier * weights[i];
                });
            }

            const userPoints = userPointsDaily.reduce((a, b) => a + b, 0);

            tokenResults.push({
                name,
                spend_usd: spendUsd,
                entry_day: entryDay,
                entry_price: entryPrice,
                user_yt: userYt,
                user_points: userPoints
            });
        });

        // Calculate network's weighted contribution (estimated from protocol TVL and multipliers)
        if (useProportionalAllocation) {
            if (pendleMode === "simple") {
                const pendleSharePath = this.buildPendleSharePath(
                    days, pendleShareMode,
                    pendleShareInitial || 0, pendleShareFinal || 0, pendleShareAverage
                );
                const netMultDaily = days.map((day, i) => {
                    return pendleSharePath[i] * baseMultiplierPendle +
                           (1.0 - pendleSharePath[i]) * baseMultiplierDirect;
                });
                
                // Network weighted contribution = Sum of (TVL × Effective Multiplier × Days Remaining)
                days.forEach((day, i) => {
                    const daysRemaining = durationDays - day;
                    totalNetworkWeightedContribution += tvl[i] * netMultDaily[i] * daysRemaining;
                });
                
                pendleShareEffective = pendleSharePath.reduce((a, b) => a + b, 0) / pendleSharePath.length;
            } else if (pendleMode === "by_tokens") {
                if (!tokenConfigs || tokenConfigs.length === 0) {
                    throw new Error("token_configs must be provided when pendle_mode='by_tokens'");
                }

                let totalTvlPendle = 0;
                let totalTvlDirect = 0;
                let basePointsWithPendle = 0;

                tokenConfigs.forEach(tokenCfg => {
                    const tvlYtPendle = parseFloat(tokenCfg.tvl_yt_pendle || 0);
                    const tvlDirect = parseFloat(tokenCfg.tvl_direct || 0);
                    const multYtPendle = parseFloat(tokenCfg.mult_yt_pendle || baseMultiplierPendle);
                    const multDirect = parseFloat(tokenCfg.mult_direct || baseMultiplierDirect);

                    basePointsWithPendle += tvlYtPendle * multYtPendle;
                    basePointsWithPendle += tvlDirect * multDirect;

                    totalTvlPendle += tvlYtPendle;
                    totalTvlDirect += tvlDirect;
                });

                const totalComponentTvl = totalTvlPendle + totalTvlDirect;
                const scalingMode = componentTvlScaling || "proportional";

                // Network weighted contribution = Sum of (Component TVL × Multiplier × Days Remaining)
                days.forEach((day, i) => {
                    const daysRemaining = durationDays - day;
                    let dailyWeightedContribution = 0;
                    
                    if (scalingMode === "proportional" || scalingMode === "share_based") {
                        // Scale component TVLs proportionally with overall TVL
                        const scaleFactor = avgTvl > 0 ? tvl[i] / avgTvl : 1;
                        
                        // Weighted contribution = (YT Pendle TVL × mult_yt_pendle + Direct TVL × mult_direct) × days remaining
                        tokenConfigs.forEach(tokenCfg => {
                            const tvlYtPendle = parseFloat(tokenCfg.tvl_yt_pendle || 0);
                            const tvlDirect = parseFloat(tokenCfg.tvl_direct || 0);
                            const multYtPendle = parseFloat(tokenCfg.mult_yt_pendle || baseMultiplierPendle);
                            const multDirect = parseFloat(tokenCfg.mult_direct || baseMultiplierDirect);
                            
                            const scaledYtPendle = tvlYtPendle * scaleFactor;
                            const scaledDirect = tvlDirect * scaleFactor;
                            
                            dailyWeightedContribution += scaledYtPendle * multYtPendle + scaledDirect * multDirect;
                        });
                    } else {
                        // Constant: component TVLs stay the same, use base values
                        tokenConfigs.forEach(tokenCfg => {
                            const tvlYtPendle = parseFloat(tokenCfg.tvl_yt_pendle || 0);
                            const tvlDirect = parseFloat(tokenCfg.tvl_direct || 0);
                            const multYtPendle = parseFloat(tokenCfg.mult_yt_pendle || baseMultiplierPendle);
                            const multDirect = parseFloat(tokenCfg.mult_direct || baseMultiplierDirect);
                            
                            dailyWeightedContribution += tvlYtPendle * multYtPendle + tvlDirect * multDirect;
                        });
                    }
                    
                    totalNetworkWeightedContribution += dailyWeightedContribution * daysRemaining;
                });

                const totalTvlAll = totalTvlPendle + totalTvlDirect;
                pendleShareEffective = totalTvlAll > 0 ? totalTvlPendle / totalTvlAll : 0;
            }
        } else {
            // TVL-generated mode: calculate pendleShareEffective for display
            if (pendleMode === "simple") {
                const pendleSharePath = this.buildPendleSharePath(
                    days, pendleShareMode,
                    pendleShareInitial || 0, pendleShareFinal || 0, pendleShareAverage
                );
                pendleShareEffective = pendleSharePath.reduce((a, b) => a + b, 0) / pendleSharePath.length;
            } else if (pendleMode === "by_tokens") {
                let totalTvlPendle = 0;
                let totalTvlDirect = 0;
                tokenConfigs.forEach(t => {
                    totalTvlPendle += parseFloat(t.tvl_yt_pendle || 0);
                    totalTvlDirect += parseFloat(t.tvl_direct || 0);
                });
                const totalTvlAll = totalTvlPendle + totalTvlDirect;
                pendleShareEffective = totalTvlAll > 0 ? totalTvlPendle / totalTvlAll : 0;
            } else {
                pendleShareEffective = 0;
            }
        }

        // Calculate user points and share based on mode
        let totalUserPoints;
        let userShare;

        if (useProportionalAllocation) {
            // Proportional allocation: User Points = Fixed Network Points × (User Weight / Total Weight)
            if (totalNetworkWeightedContribution > 0) {
                totalUserPoints = networkPoints * (totalUserWeightedContribution / totalNetworkWeightedContribution);
                userShare = totalUserWeightedContribution / totalNetworkWeightedContribution;
            } else {
                totalUserPoints = 0;
                userShare = 0;
            }
        } else {
            // TVL-generated mode: User Points = calculated from holdings, Share = User Points / Network Points
            totalUserPoints = tokenResults.reduce((sum, r) => sum + r.user_points, 0);
            userShare = networkPoints > 0 ? totalUserPoints / networkPoints : 0;
        }
        const airdropTokens = totalSupply * airdropPct;
        const userTokens = airdropTokens * userShare;

        const airdropValues = {};
        const roiPerFdv = {};
        const costVsFdv = {};

        fdvList.forEach(fdv => {
            const tokenPrice = fdv / totalSupply;
            const value = userTokens * tokenPrice;
            airdropValues[fdv] = value;
            roiPerFdv[fdv] = totalSpentUsd > 0 ? (value - totalSpentUsd) / totalSpentUsd : null;
            costVsFdv[fdv] = totalSpentUsd / fdv;
        });

        return {
            user_points: totalUserPoints,
            network_points: networkPoints,
            user_share: userShare,
            airdrop_tokens: airdropTokens,
            user_tokens: userTokens,
            total_spent_usd: totalSpentUsd,
            token_results: tokenResults,
            airdrop_values: airdropValues,
            roi_per_fdv: roiPerFdv,
            cost_vs_fdv: costVsFdv,
            avg_tvl: avgTvl,
            pendle_share_effective: pendleShareEffective
        };
    }
}

// Make available globally for browser
window.PendleCalculator = PendleCalculator;

