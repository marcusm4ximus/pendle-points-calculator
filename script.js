// Pendle YT Airdrop Calculator - UI Interactions

const calculator = new PendleCalculator();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeWelcomePage();
    initializeTooltips();
    initializeEventListeners();
    setupTvlModeToggle();
    setupPendleModeToggle();
    setupCampaignToggles();
    setupAddRemoveButtons();
    updatePageNavigation(); // Initialize first page
});

// Initialize welcome page
function initializeWelcomePage() {
    const welcomePage = document.getElementById('welcomePage');
    const configNavigation = document.getElementById('configNavigation');
    const mainContent = document.getElementById('mainContent');
    const startConfigBtn = document.getElementById('startConfigBtn');
    
    if (startConfigBtn) {
        startConfigBtn.addEventListener('click', () => {
            welcomePage.style.display = 'none';
            configNavigation.style.display = 'flex';
            mainContent.style.display = 'flex';
        });
    }
}


// Initialize tooltips - populate tooltip content from data-info
function initializeTooltips() {
    document.querySelectorAll('.tooltip-content').forEach(tooltip => {
        const info = tooltip.getAttribute('data-info');
        if (info) {
            tooltip.textContent = info;
        }
    });
    
    // Also handle labels that might have been added dynamically
    document.querySelectorAll('label[data-info]').forEach(label => {
        const info = label.getAttribute('data-info');
        const text = label.textContent.trim();
        if (info && !label.querySelector('.tooltip-text')) {
            label.innerHTML = `<span class="tooltip-text">${text}</span><span class="tooltip-content" data-info="${info}">${info}</span>`;
        }
    });
}


// Page navigation state
let currentPage = 1;
const totalPages = 5;

// Initialize event listeners
function initializeEventListeners() {
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculate);
    }
    
    // Back to Configuration button
    const backToConfigBtn = document.getElementById('backToConfigBtn');
    if (backToConfigBtn) {
        backToConfigBtn.addEventListener('click', () => {
            document.querySelector('.config-panel').style.display = 'block';
            document.querySelector('.config-navigation').style.display = 'flex';
            document.getElementById('resultsPanel').style.display = 'none';
            const backToConfigContainer = document.getElementById('backToConfigContainer');
            if (backToConfigContainer) {
                backToConfigContainer.style.display = 'none';
            }
            updatePageNavigation(); // Update to show calculate button if on last page
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => navigatePage(-1));
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => navigatePage(1));
    }
    updatePageNavigation();
}


// Setup TVL mode toggle
function setupTvlModeToggle() {
    const tvlMode = document.getElementById('tvlMode');
    const tvlAverageGroup = document.getElementById('tvlAverageGroup');
    const tvlInitialGroup = document.getElementById('tvlInitialGroup');
    const tvlFinalGroup = document.getElementById('tvlFinalGroup');
    
    function updateTvlModeVisibility() {
        const mode = tvlMode.value;
        if (mode === 'average') {
            tvlAverageGroup.style.display = 'block';
            tvlInitialGroup.style.display = 'none';
            tvlFinalGroup.style.display = 'none';
        } else {
            tvlAverageGroup.style.display = 'none';
            tvlInitialGroup.style.display = 'block';
            tvlFinalGroup.style.display = 'block';
        }
    }
    
    if (tvlMode) {
        tvlMode.addEventListener('change', updateTvlModeVisibility);
        updateTvlModeVisibility(); // Initialize on page load
    }
}

// Setup Pendle mode toggle
function setupPendleModeToggle() {
    const pendleMode = document.getElementById('pendleMode');
    const simpleSettings = document.getElementById('simpleModeSettings');
    const byTokensSettings = document.getElementById('byTokensModeSettings');
    
    // Setup Pendle Share Mode toggle for simple mode
    function setupPendleShareModeToggle() {
        const pendleShareMode = document.getElementById('pendleShareMode');
        if (!pendleShareMode) return;
        
        const shareMode = pendleShareMode.value;
        const averageGroup = document.getElementById('pendleShareAverageGroup');
        const initialGroup = document.getElementById('pendleShareInitialGroup');
        const finalGroup = document.getElementById('pendleShareFinalGroup');
        
        if (shareMode === 'average') {
            if (averageGroup) averageGroup.style.display = 'block';
            if (initialGroup) initialGroup.style.display = 'none';
            if (finalGroup) finalGroup.style.display = 'none';
        } else {
            if (averageGroup) averageGroup.style.display = 'none';
            if (initialGroup) initialGroup.style.display = 'block';
            if (finalGroup) finalGroup.style.display = 'block';
        }
    }
    
    // Initialize share mode toggle
    const pendleShareMode = document.getElementById('pendleShareMode');
    if (pendleShareMode) {
        pendleShareMode.addEventListener('change', setupPendleShareModeToggle);
        // Initialize when simple mode is shown
        if (simpleSettings && simpleSettings.style.display !== 'none') {
            setupPendleShareModeToggle();
        }
    }
    
    pendleMode.addEventListener('change', (e) => {
        if (e.target.value === 'simple') {
            simpleSettings.style.display = 'block';
            byTokensSettings.style.display = 'none';
        } else {
            simpleSettings.style.display = 'none';
            byTokensSettings.style.display = 'block';
        }
    });
}

// Update step days visibility based on price mode and post mode
function updateStepDaysVisibility(ytHolding) {
    const priceMode = ytHolding.querySelector('.yt-price-mode').value;
    const stepDaysGroup = ytHolding.querySelector('.yt-step-days-group');
    
    if (priceMode === 'stepwise_linear') {
        stepDaysGroup.style.display = 'block';
    } else if (priceMode === 'two_phase') {
        const postMode = ytHolding.querySelector('.yt-post-mode').value;
        if (postMode === 'stepwise_linear') {
            stepDaysGroup.style.display = 'block';
        } else {
            stepDaysGroup.style.display = 'none';
        }
    } else {
        stepDaysGroup.style.display = 'none';
    }
}

// Setup price mode toggles (show campaign settings when two_phase is selected)
function setupCampaignToggles() {
    // Use event delegation for dynamically added elements
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('yt-price-mode')) {
            const ytHolding = e.target.closest('.yt-holding');
            const campaignSettings = ytHolding.querySelector('.campaign-settings');
            if (e.target.value === 'two_phase') {
                campaignSettings.style.display = 'block';
            } else {
                campaignSettings.style.display = 'none';
            }
            updateStepDaysVisibility(ytHolding);
        }
        
        if (e.target.classList.contains('yt-post-mode')) {
            const ytHolding = e.target.closest('.yt-holding');
            updateStepDaysVisibility(ytHolding);
        }
    });
    
    // Initialize existing elements
    document.querySelectorAll('.yt-holding').forEach(ytHolding => {
        const priceMode = ytHolding.querySelector('.yt-price-mode');
        if (priceMode) {
            const campaignSettings = ytHolding.querySelector('.campaign-settings');
            if (priceMode.value === 'two_phase') {
                campaignSettings.style.display = 'block';
            } else {
                campaignSettings.style.display = 'none';
            }
            updateStepDaysVisibility(ytHolding);
        }
    });
}

// Renumber YT holdings after removal
function renumberYTHoldings() {
    const container = document.getElementById('ytHoldingsContainer');
    if (!container) return;
    
    const holdings = container.querySelectorAll('.yt-holding');
    holdings.forEach((holding, index) => {
        holding.setAttribute('data-holding-index', index);
        const h5 = holding.querySelector('.yt-header h5');
        if (h5) {
            h5.textContent = `Point Accruing Material ${index + 1}`;
        }
    });
}

// Renumber tokens after removal
function renumberTokens() {
    const container = document.querySelector('#tokenConfigsContainer .token-configs-grid');
    if (!container) return;
    
    const tokens = container.querySelectorAll('.token-config');
    tokens.forEach((token, index) => {
        token.setAttribute('data-token-index', index);
        const h5 = token.querySelector('.token-header h5');
        if (h5) {
            h5.textContent = `Point Accruing Material ${index + 1}`;
        }
        
        // Update placeholder based on new index
        const nameInput = token.querySelector('.token-name');
        if (nameInput) {
            const placeholder = index === 0 ? 'e.g., xUSD' : index === 1 ? 'e.g., sxUSD' : 'e.g., token';
            nameInput.placeholder = placeholder;
        }
    });
}

// Setup add/remove buttons
function setupAddRemoveButtons() {
    document.getElementById('addTokenBtn').addEventListener('click', addTokenConfig);
    document.getElementById('addYTHoldingBtn').addEventListener('click', addYTHolding);
    
    // Remove buttons are handled via event delegation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-token')) {
            e.target.closest('.token-config').remove();
            renumberTokens(); // Renumber after removal
        }
        if (e.target.classList.contains('btn-remove-yt')) {
            e.target.closest('.yt-holding').remove();
            renumberYTHoldings(); // Renumber after removal
        }
    });
}


// Add token configuration
function addTokenConfig() {
    const container = document.querySelector('#tokenConfigsContainer .token-configs-grid');
    if (!container) return;
    
    const existingTokens = container.querySelectorAll('.token-config');
    const index = existingTokens.length;
    const tokenConfig = document.createElement('div');
    tokenConfig.className = 'token-config';
    tokenConfig.setAttribute('data-token-index', index);
    
    // Determine placeholder based on index
    const placeholder = index === 0 ? 'e.g., xUSD' : index === 1 ? 'e.g., sxUSD' : 'e.g., token';
    
    tokenConfig.innerHTML = `
        <div class="token-header">
            <h5>Point Accruing Material ${index + 1}</h5>
            <button class="btn-remove-token">Remove</button>
        </div>
        <div class="input-group">
            <label>Token, Market or Material Name</label>
            <input type="text" class="token-name" value="" placeholder="${placeholder}">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">TVL YT Pendle (USD)</span>
                <span class="tooltip-content" data-info="TVL of YT on Pendle for this token"></span>
            </label>
            <input type="number" class="tvl-yt-pendle" value="0" step="1000" placeholder="e.g., 397000">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">TVL Direct (USD)</span>
                <span class="tooltip-content" data-info="TVL directly on the protocol (not on Pendle)"></span>
            </label>
            <input type="number" class="tvl-direct" value="0" step="1000" placeholder="e.g., 873000">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Multiplier YT Pendle</span>
                <span class="tooltip-content" data-info="Points multiplier for YT on Pendle"></span>
            </label>
            <input type="number" class="mult-yt-pendle" value="1.0" step="0.1">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Multiplier Direct</span>
                <span class="tooltip-content" data-info="Multiplier directly on the protocol"></span>
            </label>
            <input type="number" class="mult-direct" value="1.0" step="0.1">
        </div>
    `;
    container.appendChild(tokenConfig);
    initializeTooltips(); // Reinitialize tooltips for new elements
}

// Add YT holding
function addYTHolding() {
    const container = document.getElementById('ytHoldingsContainer');
    const index = container.children.length;
    const ytHolding = document.createElement('div');
    ytHolding.className = 'yt-holding';
    ytHolding.setAttribute('data-holding-index', index);
    ytHolding.innerHTML = `
        <div class="yt-header">
            <h5>Point Accruing Material ${index + 1}</h5>
            <button class="btn-remove-yt">Remove</button>
        </div>
        <div class="input-group">
            <label>Token, Market or Material Name</label>
            <input type="text" class="yt-name" value="" placeholder="e.g., xUSD-YT">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Average Cost of Material (USD)</span>
                <span class="tooltip-content" data-info="The price you bought the token at, which is the price at your entry day"></span>
            </label>
            <input type="number" class="yt-initial-price" value="0.01" step="0.00001" placeholder="e.g., 0.03572">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">USD to Spend</span>
                <span class="tooltip-content" data-info="How much USD you're spending"></span>
            </label>
            <input type="number" class="yt-spend-usd" value="1000" step="100" placeholder="e.g., 1500">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Multiplier</span>
                <span class="tooltip-content" data-info="Your points multiplier for this position"></span>
            </label>
            <input type="number" class="yt-multiplier" value="1.0" step="0.1">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Entry Day</span>
                <span class="tooltip-content" data-info="Day you enter (will be overridden in timing sweep)"></span>
            </label>
            <input type="number" class="yt-entry-day" value="0" min="0">
        </div>
        <div class="input-group">
            <label>
                <span class="tooltip-text">Price Mode</span>
                <span class="tooltip-content" data-info="How the material price decays over time. See explanations below."></span>
            </label>
            <select class="yt-price-mode">
                <option value="linear_to_zero">Linear to Zero</option>
                <option value="exp_to_zero">Exponential to Zero</option>
                <option value="stepwise_linear" selected>Stepwise Linear to Zero</option>
                <option value="two_phase">Two Phase (Campaign)</option>
            </select>
        </div>
        <div class="sub-section campaign-settings" style="display: none;">
            <div class="input-group">
                <label><span class="tooltip-text">Campaign End Day</span>
                    <span class="tooltip-content" data-info="The day when the campaign ends and the price drop occurs"></span></label>
                <input type="number" class="yt-campaign-end-day" value="9" min="0">
            </div>
            <div class="input-group">
                <label><span class="tooltip-text">Pre Mode</span>
                    <span class="tooltip-content" data-info="Price behavior before campaign ends: Flat (constant), Slow Linear (gradual decline), or Slow Exponential (gradual exponential decline)"></span></label>
                <select class="yt-pre-mode">
                    <option value="flat">Flat</option>
                    <option value="slow_linear">Slow Linear</option>
                    <option value="slow_exp">Slow Exponential</option>
                </select>
            </div>
            <div class="input-group">
                <label><span class="tooltip-text">Post Mode</span>
                    <span class="tooltip-content" data-info="Price behavior after campaign ends: Linear to Zero, Exponential to Zero, or Stepwise Linear to Zero"></span></label>
                <select class="yt-post-mode">
                    <option value="linear_to_zero">Linear to Zero</option>
                    <option value="exp_to_zero" selected>Exponential to Zero</option>
                    <option value="stepwise_linear">Stepwise Linear to Zero</option>
                </select>
            </div>
            <div class="input-group">
                <label><span class="tooltip-text">Post Discount (%)</span>
                    <span class="tooltip-content" data-info="Percentage price drop when campaign ends (e.g., 30% means price drops to 70% of pre-campaign price)"></span></label>
                <input type="number" class="yt-post-discount" value="30" step="1" min="0" max="100">
            </div>
        </div>
        <div class="input-group yt-step-days-group" style="display: none;">
            <label><span class="tooltip-text">Step Days</span>
                <span class="tooltip-content" data-info="Step size for stepwise modes. Usually the day of yield distribution frequency (e.g., 7 for weekly distributions)"></span></label>
            <input type="number" class="yt-step-days" value="7" min="1">
        </div>
    `;
    container.appendChild(ytHolding);
    initializeTooltips(); // Reinitialize tooltips for new elements
    
    // Setup price mode toggle for the new element
    const priceModeSelect = ytHolding.querySelector('.yt-price-mode');
    if (priceModeSelect) {
        priceModeSelect.addEventListener('change', (e) => {
            const campaignSettings = ytHolding.querySelector('.campaign-settings');
            if (e.target.value === 'two_phase') {
                campaignSettings.style.display = 'block';
            } else {
                campaignSettings.style.display = 'none';
            }
            updateStepDaysVisibility(ytHolding);
        });
        
        // Setup post mode toggle for campaign settings
        const postModeSelect = ytHolding.querySelector('.yt-post-mode');
        if (postModeSelect) {
            postModeSelect.addEventListener('change', () => {
                updateStepDaysVisibility(ytHolding);
            });
        }
        
        // Initialize visibility
        updateStepDaysVisibility(ytHolding);
    }
}

// Read configuration from form
function readConfig() {
    const fdvListStr = document.getElementById('fdvList').value;
    const fdvList = fdvListStr.split(',').map(s => parseFloat(s.trim()) * 1000000);
    
    const entryDaysStr = document.getElementById('entryDaysToTest').value.trim();
    const entryDaysToTest = entryDaysStr ? entryDaysStr.split(',').map(s => parseInt(s.trim())) : null;
    
    // Read token configs
    const tokenConfigs = [];
    document.querySelectorAll('.token-config').forEach((config, index) => {
        tokenConfigs.push({
            name: config.querySelector('.token-name').value,
            tvl_yt_pendle: parseFloat(config.querySelector('.tvl-yt-pendle').value),
            tvl_direct: parseFloat(config.querySelector('.tvl-direct').value),
            mult_yt_pendle: parseFloat(config.querySelector('.mult-yt-pendle').value),
            mult_direct: parseFloat(config.querySelector('.mult-direct').value)
        });
    });
    
    // Read YT holdings
    const userYtTokens = [];
    document.querySelectorAll('.yt-holding').forEach((holding, index) => {
        const priceMode = holding.querySelector('.yt-price-mode').value;
        const campaignEnabled = priceMode === 'two_phase';
        const ytCfg = {
            name: holding.querySelector('.yt-name').value,
            initial_price: parseFloat(holding.querySelector('.yt-initial-price').value),
            spend_usd: parseFloat(holding.querySelector('.yt-spend-usd').value),
            multiplier: parseFloat(holding.querySelector('.yt-multiplier').value),
            entry_day: parseInt(holding.querySelector('.yt-entry-day').value),
            yt_price_mode: priceMode,
            step_days: parseInt(holding.querySelector('.yt-step-days').value),
            campaign_enabled: campaignEnabled
        };
        
        if (campaignEnabled) {
            ytCfg.campaign_end_day = parseInt(holding.querySelector('.yt-campaign-end-day').value);
            ytCfg.pre_mode = holding.querySelector('.yt-pre-mode').value;
            ytCfg.post_mode = holding.querySelector('.yt-post-mode').value;
            ytCfg.post_discount = parseFloat(holding.querySelector('.yt-post-discount').value) / 100;
        }
        
        userYtTokens.push(ytCfg);
    });
    
    const networkPointsTotalStr = document.getElementById('networkPointsTotal').value.trim();
    const networkPointsTotal = networkPointsTotalStr ? parseFloat(networkPointsTotalStr) : null;
    
    return {
        airdropPct: parseFloat(document.getElementById('airdropPct').value) / 100,
        totalSupply: parseFloat(document.getElementById('totalSupply').value),
        durationDays: parseInt(document.getElementById('durationDays').value),
        tvlMode: document.getElementById('tvlMode').value,
        tvlInitial: parseFloat(document.getElementById('tvlInitial').value),
        tvlFinal: parseFloat(document.getElementById('tvlFinal').value),
        tvlAverage: parseFloat(document.getElementById('tvlAverage').value),
        pendleMode: document.getElementById('pendleMode').value,
        pendleShareMode: document.getElementById('pendleShareMode').value,
        pendleShareInitial: document.getElementById('pendleShareInitialGroup') && document.getElementById('pendleShareInitialGroup').style.display !== 'none' ? parseFloat(document.getElementById('pendleShareInitial').value) / 100 : null,
        pendleShareFinal: document.getElementById('pendleShareFinalGroup') && document.getElementById('pendleShareFinalGroup').style.display !== 'none' ? parseFloat(document.getElementById('pendleShareFinal').value) / 100 : null,
        pendleShareAverage: document.getElementById('pendleShareAverageGroup') && document.getElementById('pendleShareAverageGroup').style.display !== 'none' ? parseFloat(document.getElementById('pendleShareAverage').value) / 100 : null,
        baseMultiplierPendle: parseFloat(document.getElementById('baseMultiplierPendle').value),
        baseMultiplierDirect: parseFloat(document.getElementById('baseMultiplierDirect').value),
        tokenConfigs: tokenConfigs,
        userYtTokens: userYtTokens,
        timeWeighting: document.getElementById('timeWeighting').checked,
        fdvList: fdvList,
        networkPointsTotal: networkPointsTotal,
        componentTvlScaling: document.getElementById('componentTvlScaling').value,
        runTimingSweep: document.getElementById('runTimingSweep').checked,
        entryDaysToTest: entryDaysToTest
    };
}

// Validate configuration before calculation
function validateConfig() {
    const errors = [];
    
    // Helper function to check if a value is empty or invalid
    function isEmptyOrInvalid(value, min = 0) {
        if (value === null || value === undefined) return true;
        const trimmed = String(value).trim();
        // Check if truly empty
        if (trimmed === '' || trimmed === null || trimmed === undefined) {
            return true;
        }
        // Parse the number
        const num = parseFloat(trimmed);
        if (isNaN(num)) return true;
        // For min > 0, zero or negative is invalid
        // For min <= 0 (like -1 for allowing 0), only negative is invalid
        return num <= min;
    }
    
    // Global Parameters
    const airdropPctEl = document.getElementById('airdropPct');
    if (!airdropPctEl || isEmptyOrInvalid(airdropPctEl.value, 0)) {
        errors.push("Global Parameters: Airdrop Percentage is required and must be greater than 0");
    }
    
    const totalSupplyEl = document.getElementById('totalSupply');
    if (!totalSupplyEl || isEmptyOrInvalid(totalSupplyEl.value, 0)) {
        errors.push("Global Parameters: Total Supply is required and must be greater than 0");
    }
    
    const durationDaysEl = document.getElementById('durationDays');
    if (!durationDaysEl || isEmptyOrInvalid(durationDaysEl.value, 0)) {
        errors.push("Global Parameters: Points Season/Program Duration/Time-to-Maturity (Days) is required and must be greater than 0");
    }
    
    // Protocol TVL
    const tvlModeEl = document.getElementById('tvlMode');
    if (!tvlModeEl) {
        errors.push("Protocol TVL: TVL Mode is required");
    } else {
        const tvlMode = tvlModeEl.value;
        
        if (tvlMode === 'average') {
            const tvlAverageEl = document.getElementById('tvlAverage');
            if (!tvlAverageEl || isEmptyOrInvalid(tvlAverageEl.value, 0)) {
                errors.push("Protocol TVL: TVL Average is required when Average (Constant) mode is selected");
            }
        } else {
            const tvlInitialEl = document.getElementById('tvlInitial');
            if (!tvlInitialEl || isEmptyOrInvalid(tvlInitialEl.value, 0)) {
                errors.push("Protocol TVL: TVL Initial is required and must be greater than 0");
            }
            
            if (tvlMode !== 'constant') {
                const tvlFinalEl = document.getElementById('tvlFinal');
                if (!tvlFinalEl || isEmptyOrInvalid(tvlFinalEl.value, 0)) {
                    errors.push("Protocol TVL: TVL Final is required and must be greater than 0");
                }
            }
        }
    }
    
    // Pendle Settings
    const pendleModeEl = document.getElementById('pendleMode');
    if (!pendleModeEl) {
        errors.push("Pendle Settings: Pendle Mode is required");
    } else {
        const pendleMode = pendleModeEl.value;
        
        if (pendleMode === 'simple') {
            const pendleShareModeEl = document.getElementById('pendleShareMode');
            if (!pendleShareModeEl) {
                errors.push("Pendle Settings: Pendle Share Mode is required");
            } else {
                const pendleShareMode = pendleShareModeEl.value;
                
                if (pendleShareMode === 'average') {
                    const pendleShareAverageEl = document.getElementById('pendleShareAverage');
                    if (!pendleShareAverageEl || isEmptyOrInvalid(pendleShareAverageEl.value, 0)) {
                        errors.push("Pendle Settings: Pendle Share Average is required when Average (Constant) mode is selected");
                    }
                } else {
                    const pendleShareInitialEl = document.getElementById('pendleShareInitial');
                    if (!pendleShareInitialEl || isEmptyOrInvalid(pendleShareInitialEl.value, 0)) {
                        errors.push("Pendle Settings: Pendle Share Initial is required and must be greater than 0");
                    }
                    
                    if (pendleShareMode !== 'constant') {
                        const pendleShareFinalEl = document.getElementById('pendleShareFinal');
                        if (!pendleShareFinalEl || isEmptyOrInvalid(pendleShareFinalEl.value, 0)) {
                            errors.push("Pendle Settings: Pendle Share Final is required and must be greater than 0");
                        }
                    }
                }
            }
            
            const baseMultiplierPendleEl = document.getElementById('baseMultiplierPendle');
            if (!baseMultiplierPendleEl || isEmptyOrInvalid(baseMultiplierPendleEl.value, 0)) {
                errors.push("Pendle Settings: Base Point Multiplier Pendle is required and must be greater than 0");
            }
            
            const baseMultiplierDirectEl = document.getElementById('baseMultiplierDirect');
            if (!baseMultiplierDirectEl || isEmptyOrInvalid(baseMultiplierDirectEl.value, 0)) {
                errors.push("Pendle Settings: Base Point Multiplier Direct is required and must be greater than 0");
            }
        } else if (pendleMode === 'by_tokens') {
            const tokenConfigs = document.querySelectorAll('.token-config');
            if (tokenConfigs.length === 0) {
                errors.push("Pendle Settings: At least one token configuration is required in By Tokens mode");
            } else {
                tokenConfigs.forEach((config, index) => {
                    const tokenNameEl = config.querySelector('.token-name');
                    const tokenName = tokenNameEl ? tokenNameEl.value.trim() : '';
                    if (!tokenName) {
                        errors.push(`Pendle Settings: Token ${index + 1} - Token, Market or Material Name is required`);
                    }
                    
                    const tvlYtPendleEl = config.querySelector('.tvl-yt-pendle');
                    if (!tvlYtPendleEl || isEmptyOrInvalid(tvlYtPendleEl.value, -1)) {
                        errors.push(`Pendle Settings: Token ${index + 1} (${tokenName || 'unnamed'}) - TVL YT Pendle (USD) is required and must be 0 or greater`);
                    }
                    
                    const tvlDirectEl = config.querySelector('.tvl-direct');
                    if (!tvlDirectEl || isEmptyOrInvalid(tvlDirectEl.value, -1)) {
                        errors.push(`Pendle Settings: Token ${index + 1} (${tokenName || 'unnamed'}) - TVL Direct (USD) is required and must be 0 or greater`);
                    }
                    
                    const multYtPendleEl = config.querySelector('.mult-yt-pendle');
                    if (!multYtPendleEl || isEmptyOrInvalid(multYtPendleEl.value, 0)) {
                        errors.push(`Pendle Settings: Token ${index + 1} (${tokenName || 'unnamed'}) - Multiplier YT Pendle is required and must be greater than 0`);
                    }
                    
                    const multDirectEl = config.querySelector('.mult-direct');
                    if (!multDirectEl || isEmptyOrInvalid(multDirectEl.value, 0)) {
                        errors.push(`Pendle Settings: Token ${index + 1} (${tokenName || 'unnamed'}) - Multiplier Direct is required and must be greater than 0`);
                    }
                });
            }
        }
    }
    
    // Point Accruing Holdings
    const ytHoldings = document.querySelectorAll('.yt-holding');
    if (ytHoldings.length === 0) {
        errors.push("Point Accruing Holdings: At least one Point Accruing Material is required");
    } else {
        ytHoldings.forEach((holding, index) => {
            const tokenNameEl = holding.querySelector('.yt-name');
            const tokenName = tokenNameEl ? tokenNameEl.value.trim() : '';
            if (!tokenName) {
                errors.push(`Point Accruing Holdings: Material ${index + 1} - Token, Market or Material Name is required`);
            }
            
            const initialPriceEl = holding.querySelector('.yt-initial-price');
            if (!initialPriceEl || isEmptyOrInvalid(initialPriceEl.value, 0)) {
                errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Average Cost of Material (USD) is required and must be greater than 0`);
            }
            
            const spendUsdEl = holding.querySelector('.yt-spend-usd');
            if (!spendUsdEl || isEmptyOrInvalid(spendUsdEl.value, 0)) {
                errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Amount Spent (USD) is required and must be greater than 0`);
            }
            
            const multiplierEl = holding.querySelector('.yt-multiplier');
            if (!multiplierEl || isEmptyOrInvalid(multiplierEl.value, 0)) {
                errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Multiplier is required and must be greater than 0`);
            }
            
            const entryDayEl = holding.querySelector('.yt-entry-day');
            if (!entryDayEl || isEmptyOrInvalid(entryDayEl.value, -1)) {
                errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Entry Day is required and must be 0 or greater`);
            }
            
            const priceModeEl = holding.querySelector('.yt-price-mode');
            if (priceModeEl && priceModeEl.value === 'two_phase') {
                const campaignEndDayEl = holding.querySelector('.yt-campaign-end-day');
                if (!campaignEndDayEl || isEmptyOrInvalid(campaignEndDayEl.value, -1)) {
                    errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Campaign End Day is required and must be 0 or greater`);
                }
                
                const postDiscountEl = holding.querySelector('.yt-post-discount');
                if (!postDiscountEl) {
                    errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Post-Campaign Discount (%) is required`);
                } else {
                    const postDiscount = postDiscountEl.value.trim();
                    const discountNum = parseFloat(postDiscount);
                    if (!postDiscount || isNaN(discountNum) || discountNum < 0 || discountNum > 100) {
                        errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Post-Campaign Discount (%) is required and must be between 0 and 100`);
                    }
                }
            }
            
            // Check if step days is required
            const stepDaysInput = holding.querySelector('.yt-step-days');
            if (stepDaysInput && stepDaysInput.offsetParent !== null) {
                if (isEmptyOrInvalid(stepDaysInput.value, 0)) {
                    errors.push(`Point Accruing Holdings: Material ${index + 1} (${tokenName || 'unnamed'}) - Step Days is required and must be greater than 0`);
                }
            }
        });
    }
    
    // Other Settings
    const fdvListEl = document.getElementById('fdvList');
    if (!fdvListEl) {
        errors.push("Other Settings: FDV Scenarios field is missing");
    } else {
        const fdvList = fdvListEl.value.trim();
        if (!fdvList) {
            errors.push("Other Settings: FDV Scenarios is required (e.g., 20,50,100,200,500)");
        } else {
            const fdvValues = fdvList.split(',').map(s => s.trim()).filter(s => s);
            if (fdvValues.length === 0) {
                errors.push("Other Settings: FDV Scenarios must contain at least one value");
            } else {
                fdvValues.forEach((fdv, index) => {
                    if (isNaN(parseFloat(fdv)) || parseFloat(fdv) <= 0) {
                        errors.push(`Other Settings: FDV Scenarios - Value ${index + 1} ("${fdv}") is not a valid number`);
                    }
                });
            }
        }
    }
    
    return errors;
}

// Calculate and display results
function calculate() {
    console.log("Calculate button clicked!");
    
    // Validate first
    let validationErrors = [];
    try {
        validationErrors = validateConfig();
        console.log("Validation completed. Errors found:", validationErrors.length);
        console.log("Validation errors:", validationErrors);
    } catch (error) {
        console.error("Error during validation:", error);
        validationErrors = ["Validation error: " + error.message];
    }
    
    if (validationErrors.length > 0) {
        // Show errors in a user-friendly way
        const errorMessage = "Please fill in the following missing or invalid fields:\n\n" + validationErrors.join("\n");
        console.log("Displaying error message:", errorMessage);
        displayError(errorMessage);
        
        // Scroll to top to see the error
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    
    console.log("Validation passed, proceeding with calculation...");
    
    try {
        const config = readConfig();
        const results = calculator.simulateAirdropUnified(config);
        
        // Hide config panel, show results panel
        document.querySelector('.config-panel').style.display = 'none';
        document.querySelector('.config-navigation').style.display = 'none';
        document.getElementById('resultsPanel').style.display = 'block';
        const backToConfigContainer = document.getElementById('backToConfigContainer');
        if (backToConfigContainer) {
            backToConfigContainer.style.display = 'flex';
        }
        
        displayResults(results, config);
        
        // Check if timing sweep is enabled
        if (config.runTimingSweep) {
            try {
                const timingResults = calculateTimingSweep(config);
                displayTimingSweepResults(timingResults, config);
            } catch (error) {
                console.error("Error calculating timing sweep:", error);
                displayError("Error calculating timing sweep: " + error.message);
            }
        }
    } catch (error) {
        displayError(error.message);
    }
}

// Display results
function displayResults(results, config) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    // Show back button container
    const backToConfigContainer = document.getElementById('backToConfigContainer');
    if (backToConfigContainer) {
        backToConfigContainer.style.display = 'flex';
    }
    
    // Main results
    const resultsSection = document.createElement('div');
    resultsSection.className = 'results-content';
    
    resultsSection.innerHTML = `
        <div class="results-section">
            <h3>Main Results</h3>
            <div class="result-item">
                <span class="result-label">Network Points:</span>
                <span class="result-value">${formatNumber(results.network_points)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">User Share:</span>
                <span class="result-value">${(results.user_share * 100).toFixed(4)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">User Tokens:</span>
                <span class="result-value">${formatNumber(results.user_tokens)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Total Spent:</span>
                <span class="result-value">$${formatNumber(results.total_spent_usd)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Avg TVL:</span>
                <span class="result-value">$${formatNumber(results.avg_tvl)}</span>
            </div>
            <div class="result-item">
                <span class="result-label">Pendle Share:</span>
                <span class="result-value">${(results.pendle_share_effective * 100).toFixed(2)}%</span>
            </div>
        </div>
        
        <div class="results-section">
            <h3>Your Token Positions</h3>
            ${results.token_results.map(token => `
                <div class="result-item">
                    <span class="result-label">${token.name}:</span>
                    <span class="result-value">${formatNumber(token.user_yt)} YT @ $${token.entry_price.toFixed(4)} (Day ${token.entry_day})</span>
                </div>
            `).join('')}
        </div>
        
        <div class="results-section">
            <h3>Airdrop Values at Different FDVs</h3>
            ${Object.entries(results.airdrop_values).map(([fdv, value]) => {
                const roi = results.roi_per_fdv[fdv];
                const roiClass = roi > 0 ? 'roi-positive' : 'roi-negative';
                return `
                    <div class="result-item">
                        <span class="result-label">FDV $${(fdv / 1000000).toFixed(0)}M:</span>
                        <span class="result-value ${roiClass}">$${formatNumber(value)} (ROI: ${(roi * 100).toFixed(2)}%)</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.appendChild(resultsSection);
}

function displayTimingSweepPlaceholder() {
    const container = document.getElementById('resultsContainer');
    const timingSection = document.createElement('div');
    timingSection.className = 'timing-sweep-results';
    timingSection.innerHTML = `
        <div class="results-section">
            <h3>Timing Sweep</h3>
            <p class="placeholder">Timing sweep feature coming soon...</p>
        </div>
    `;
    container.appendChild(timingSection);
}

// Calculate optimal entry
// Calculate timing sweep - test different entry days for existing holdings
function calculateTimingSweep(baseConfig) {
    // Get entry days to test
    const entryDaysToTest = baseConfig.entryDaysToTest;
    let daysToTest;
    
    if (entryDaysToTest && entryDaysToTest.length > 0) {
        // Filter and validate the specified days
        daysToTest = entryDaysToTest
            .filter(d => !isNaN(d) && d >= 0 && d < baseConfig.durationDays)
            .sort((a, b) => a - b);  // Sort in ascending order
        console.log("Testing specified entry days:", daysToTest);
    } else {
        // If no days specified, test all days
        daysToTest = Array.from({ length: baseConfig.durationDays }, (_, i) => i);
        console.log("No entry days specified, testing all days:", daysToTest.length);
    }
    
    const results = [];
    
    // Test each entry day for each holding
    baseConfig.userYtTokens.forEach((holding, holdingIndex) => {
        const holdingResults = [];
        
        daysToTest.forEach(entryDay => {
            // Calculate YT price at this entry day
            const days = Array.from({ length: baseConfig.durationDays }, (_, i) => i);
            const pricePath = calculator.buildYtPricePath(
                days,
                holding.yt_price_mode,
                holding.initial_price,
                1e-4,
                holding.step_days || 7,
                holding.campaign_enabled || false,
                holding.campaign_end_day,
                holding.pre_mode || 'flat',
                holding.post_mode || 'linear_to_zero',
                holding.post_discount || 0.3
            );
            
            const ytPriceAtEntry = pricePath[entryDay];
            
            // Create modified holding with new entry day
            const modifiedHolding = {
                ...holding,
                entry_day: entryDay,
                initial_price: ytPriceAtEntry  // Update initial price to match entry day price
            };
            
            // Create test config with modified holding
            const testConfig = {
                ...baseConfig,
                userYtTokens: baseConfig.userYtTokens.map((h, i) => 
                    i === holdingIndex ? modifiedHolding : h
                )
            };
            
            try {
                const calcResults = calculator.simulateAirdropUnified(testConfig);
                
                // Calculate ROI for each FDV
                const rois = {};
                const roiValues = [];
                
                baseConfig.fdvList.forEach(fdv => {
                    const tokenPrice = fdv / baseConfig.totalSupply;
                    const airdropTokens = baseConfig.totalSupply * baseConfig.airdropPct * calcResults.user_share;
                    const airdropValue = airdropTokens * tokenPrice;
                    const totalSpent = calcResults.total_spent_usd;
                    const roi = (airdropValue - totalSpent) / totalSpent;
                    rois[fdv] = roi;
                    roiValues.push(roi);
                });
                
                const avgRoi = roiValues.reduce((a, b) => a + b, 0) / roiValues.length;
                const minRoi = Math.min(...roiValues);
                const maxRoi = Math.max(...roiValues);
                
                // Calculate variance
                const variance = roiValues.reduce((sum, roi) => sum + Math.pow(roi - avgRoi, 2), 0) / roiValues.length;
                const stdDev = Math.sqrt(variance);
                const riskRewardScore = avgRoi - (stdDev * 0.5);
                
                holdingResults.push({
                    holdingIndex: holdingIndex,
                    holdingName: holding.name,
                    entryDay: entryDay,
                    ytPrice: ytPriceAtEntry,
                    rois: rois,
                    avgRoi: avgRoi,
                    minRoi: minRoi,
                    maxRoi: maxRoi,
                    riskRewardScore: riskRewardScore,
                    userShare: calcResults.user_share
                });
            } catch (error) {
                console.warn(`Error calculating for holding ${holdingIndex}, entry day ${entryDay}:`, error);
            }
        });
        
        // Sort by entry day (ascending) to show in order, not by risk/reward
        holdingResults.sort((a, b) => a.entryDay - b.entryDay);
        results.push({
            holdingName: holding.name,
            options: holdingResults  // Show all days, not just top 5
        });
    });
    
    return results;
}

// Display timing sweep results
function displayTimingSweepResults(timingResults, config) {
    const container = document.getElementById('resultsContainer');
    
    if (!timingResults || timingResults.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'results-section';
        noResults.style.marginTop = '40px';
        noResults.innerHTML = `
            <h3 style="color: var(--yt-blue);">Timing Sweep Results</h3>
            <p style="color: var(--mono-200);">No results found.</p>
        `;
        container.appendChild(noResults);
        return;
    }
    
    // Create section for timing sweep results
    const timingSection = document.createElement('div');
    timingSection.className = 'results-section';
    timingSection.style.marginTop = '40px';
    timingSection.style.paddingTop = '30px';
    timingSection.style.borderTop = '2px solid var(--water-700)';
    
    timingSection.innerHTML = `
        <h3 style="color: var(--yt-blue); margin-bottom: 20px;">Timing Sweep Results</h3>
        <p style="color: var(--mono-200); margin-bottom: 25px;">Results for each entry day tested, showing estimated YT price and ROI across FDV scenarios</p>
    `;
    
    // Display results for each holding
    timingResults.forEach((holdingResult, holdingIdx) => {
        if (holdingResult.options.length === 0) return;
        
        const holdingDiv = document.createElement('div');
        holdingDiv.style.marginBottom = '40px';
        holdingDiv.style.padding = '20px';
        holdingDiv.style.background = 'rgba(96, 121, 255, 0.05)';
        holdingDiv.style.border = '1px solid var(--water-600)';
        holdingDiv.style.borderRadius = '6px';
        
        holdingDiv.innerHTML = `
            <h4 style="color: var(--yt-blue); margin-bottom: 20px;">${holdingResult.holdingName}</h4>
        `;
        
        // Display top options for this holding
        holdingResult.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.style.marginBottom = '20px';
            optionDiv.style.padding = '15px';
            optionDiv.style.background = 'rgba(96, 121, 255, 0.1)';
            optionDiv.style.border = '2px solid var(--water-500)';
            optionDiv.style.borderRadius = '6px';
            
            const rankColor = index === 0 ? 'var(--pt-green)' : index === 1 ? 'var(--yt-blue)' : 'var(--water-400)';
            
            optionDiv.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h5 style="color: ${rankColor}; margin: 0;">Option ${index + 1}</h5>
                    <span style="color: var(--mono-200); font-size: 0.9em;">Risk/Reward: <strong style="color: ${rankColor};">${(option.riskRewardScore * 100).toFixed(2)}%</strong></span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 12px;">
                    <div>
                        <span style="color: var(--mono-300); font-size: 0.9em;">Entry Day:</span>
                        <strong style="color: var(--mono-100); display: block;">${option.entryDay}</strong>
                    </div>
                    <div>
                        <span style="color: var(--mono-300); font-size: 0.9em;">YT Price:</span>
                        <strong style="color: var(--mono-100); display: block;">$${option.ytPrice.toFixed(5)}</strong>
                    </div>
                    <div>
                        <span style="color: var(--mono-300); font-size: 0.9em;">Avg ROI:</span>
                        <strong style="color: var(--pt-green); display: block;">${(option.avgRoi * 100).toFixed(2)}%</strong>
                    </div>
                    <div>
                        <span style="color: var(--mono-300); font-size: 0.9em;">User Share:</span>
                        <strong style="color: var(--mono-100); display: block;">${(option.userShare * 100).toFixed(4)}%</strong>
                    </div>
                </div>
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--water-700);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
                        ${config.fdvList.map(fdv => {
                            const roi = option.rois[fdv];
                            const roiClass = roi > 0 ? 'var(--pt-green)' : 'var(--guava)';
                            return `
                                <div style="padding: 6px; background: rgba(0,0,0,0.2); border-radius: 4px; text-align: center;">
                                    <div style="color: var(--mono-300); font-size: 0.8em;">$${(fdv / 1000000).toFixed(0)}M</div>
                                    <strong style="color: ${roiClass}; font-size: 0.9em;">${(roi * 100).toFixed(1)}%</strong>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            holdingDiv.appendChild(optionDiv);
        });
        
        timingSection.appendChild(holdingDiv);
    });
    
    container.appendChild(timingSection);
    
    // Add chart showing ROI vs Entry Day
    displayTimingSweepChart(timingResults, config);
}

// Display chart for timing sweep results
function displayTimingSweepChart(timingResults, config) {
    const container = document.getElementById('resultsContainer');
    
    const chartSection = document.createElement('div');
    chartSection.className = 'results-section';
    chartSection.style.marginTop = '30px';
    chartSection.style.padding = '20px';
    chartSection.style.background = 'rgba(0,0,0,0.2)';
    chartSection.style.borderRadius = '6px';
    
    chartSection.innerHTML = `
        <h4 style="color: var(--yt-blue); margin-bottom: 15px;">ROI vs Entry Day</h4>
        <canvas id="timingSweepChart" style="max-height: 400px;"></canvas>
    `;
    
    container.appendChild(chartSection);
    
    // Wait for canvas to be in DOM
    setTimeout(() => {
        const ctx = document.getElementById('timingSweepChart');
        if (!ctx || typeof Chart === 'undefined') {
            console.warn("Chart.js not loaded or canvas not found");
            return;
        }
        
        // Prepare data for all holdings
        const datasets = [];
        const colors = [
            { border: 'rgb(27, 227, 194)', fill: 'rgba(27, 227, 194, 0.1)' },  // pt-green
            { border: 'rgb(122, 183, 255)', fill: 'rgba(122, 183, 255, 0.1)' },  // yt-blue
            { border: 'rgb(96, 121, 255)', fill: 'rgba(96, 121, 255, 0.1)' },   // pendle-blue
            { border: 'rgb(240, 206, 116)', fill: 'rgba(240, 206, 116, 0.1)' }, // gold
            { border: 'rgb(239, 181, 75)', fill: 'rgba(239, 181, 75, 0.1)' }   // warning
        ];
        
        // Get all unique entry days across all holdings
        const allEntryDays = new Set();
        timingResults.forEach(holdingResult => {
            holdingResult.options.forEach(option => {
                allEntryDays.add(option.entryDay);
            });
        });
        const sortedEntryDays = Array.from(allEntryDays).sort((a, b) => a - b);
        
        // Create dataset for each holding
        timingResults.forEach((holdingResult, holdingIdx) => {
            if (holdingResult.options.length === 0) return;
            
            const avgRois = sortedEntryDays.map(day => {
                const option = holdingResult.options.find(o => o.entryDay === day);
                return option ? option.avgRoi * 100 : null;
            });
            
            const color = colors[holdingIdx % colors.length];
            
            datasets.push({
                label: `${holdingResult.holdingName} - Avg ROI`,
                data: avgRois,
                borderColor: color.border,
                backgroundColor: color.fill,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            });
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedEntryDays,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgb(222, 222, 222)',
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: 'Average ROI by Entry Day',
                        color: 'rgb(222, 222, 222)',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                if (value === null) return '';
                                return context.dataset.label + ': ' + value.toFixed(2) + '%';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Entry Day',
                            color: 'rgb(222, 222, 222)',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            color: 'rgb(222, 222, 222)'
                        },
                        grid: {
                            color: 'rgba(222, 222, 222, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'ROI (%)',
                            color: 'rgb(222, 222, 222)',
                            font: {
                                size: 14
                            }
                        },
                        ticks: {
                            color: 'rgb(222, 222, 222)',
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: 'rgba(222, 222, 222, 0.1)'
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }, 100);
}


function displayError(message) {
    console.log("displayError called with message:", message);
    
    // Show results panel to display error
    const configPanel = document.querySelector('.config-panel');
    const configNav = document.querySelector('.config-navigation');
    const resultsPanel = document.getElementById('resultsPanel');
    
    console.log("Elements found:", {
        configPanel: !!configPanel,
        configNav: !!configNav,
        resultsPanel: !!resultsPanel
    });
    
    if (configPanel) {
        configPanel.style.display = 'none';
        console.log("Hid config panel");
    }
    if (configNav) {
        configNav.style.display = 'none';
        console.log("Hid config nav");
    }
    if (resultsPanel) {
        resultsPanel.style.display = 'block';
        console.log("Showed results panel");
    }
    
    const backToConfigContainer = document.getElementById('backToConfigContainer');
    if (backToConfigContainer) {
        backToConfigContainer.style.display = 'flex';
    }
    
    const container = document.getElementById('resultsContainer');
    if (!container) {
        console.error("Results container not found!");
        alert("Error: " + message);
        return;
    }
    
    console.log("Container found, setting innerHTML");
    
    // Format error message with line breaks
    const formattedMessage = message.split('\n').map(line => {
        if (line.trim() === '') return '<br>';
        return `<div style="margin: 8px 0; padding-left: 15px; border-left: 3px solid #ff6666;">${line}</div>`;
    }).join('');
    
    container.innerHTML = `
        <div class="error" style="padding: 25px; background: rgba(255, 0, 0, 0.15); border: 3px solid #ff4444; border-radius: 8px; color: #ffaaaa; margin: 20px 0;">
            <h3 style="color: #ff6666; margin-top: 0; margin-bottom: 15px; font-size: 1.3em;">⚠️ Missing or Invalid Information</h3>
            <div style="line-height: 1.8; font-size: 1.05em;">${formattedMessage}</div>
        </div>
    `;
    
    console.log("Error displayed in container. Container innerHTML length:", container.innerHTML.length);
    
    // Force a repaint
    container.offsetHeight;
}

function formatNumber(num) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}


// Apply configuration to form
function applyConfig(config) {
    // Global parameters
    if (config.airdropPct !== undefined) document.getElementById('airdropPct').value = config.airdropPct * 100;
    if (config.totalSupply !== undefined) document.getElementById('totalSupply').value = config.totalSupply;
    if (config.durationDays !== undefined) document.getElementById('durationDays').value = config.durationDays;
    if (config.networkPointsTotal !== undefined) document.getElementById('networkPointsTotal').value = config.networkPointsTotal || '';
    
    // TVL
    if (config.tvlMode !== undefined) document.getElementById('tvlMode').value = config.tvlMode;
    if (config.tvlInitial !== undefined) document.getElementById('tvlInitial').value = config.tvlInitial;
    if (config.tvlFinal !== undefined) document.getElementById('tvlFinal').value = config.tvlFinal;
    if (config.tvlAverage !== undefined) document.getElementById('tvlAverage').value = config.tvlAverage;
    
    // Pendle settings
    if (config.pendleMode !== undefined) {
        document.getElementById('pendleMode').value = config.pendleMode;
        document.getElementById('pendleMode').dispatchEvent(new Event('change'));
    }
    if (config.pendleShareMode !== undefined) {
        document.getElementById('pendleShareMode').value = config.pendleShareMode;
        document.getElementById('pendleShareMode').dispatchEvent(new Event('change'));
    }
    if (config.pendleShareInitial !== undefined) document.getElementById('pendleShareInitial').value = config.pendleShareInitial * 100;
    if (config.pendleShareFinal !== undefined) document.getElementById('pendleShareFinal').value = config.pendleShareFinal * 100;
    if (config.pendleShareAverage !== undefined) document.getElementById('pendleShareAverage').value = config.pendleShareAverage * 100;
    if (config.baseMultiplierPendle !== undefined) document.getElementById('baseMultiplierPendle').value = config.baseMultiplierPendle;
    if (config.baseMultiplierDirect !== undefined) document.getElementById('baseMultiplierDirect').value = config.baseMultiplierDirect;
    if (config.componentTvlScaling !== undefined) document.getElementById('componentTvlScaling').value = config.componentTvlScaling;
    
    // Token configs
    if (config.tokenConfigs && config.tokenConfigs.length > 0) {
        const container = document.getElementById('tokenConfigsContainer');
        container.innerHTML = '';
        config.tokenConfigs.forEach((tokenCfg, index) => {
            addTokenConfig();
            const lastConfig = container.lastElementChild;
            lastConfig.querySelector('.token-name').value = tokenCfg.name || '';
            lastConfig.querySelector('.tvl-yt-pendle').value = tokenCfg.tvl_yt_pendle || 0;
            lastConfig.querySelector('.tvl-direct').value = tokenCfg.tvl_direct || 0;
            lastConfig.querySelector('.mult-yt-pendle').value = tokenCfg.mult_yt_pendle || 1;
            lastConfig.querySelector('.mult-direct').value = tokenCfg.mult_direct || 1;
        });
    }
    
    // YT holdings
    if (config.userYtTokens && config.userYtTokens.length > 0) {
        const container = document.getElementById('ytHoldingsContainer');
        container.innerHTML = '';
        config.userYtTokens.forEach((ytCfg, index) => {
            addYTHolding();
            const lastHolding = container.lastElementChild;
            lastHolding.querySelector('.yt-name').value = ytCfg.name || '';
            lastHolding.querySelector('.yt-initial-price').value = ytCfg.initial_price || 0;
            lastHolding.querySelector('.yt-spend-usd').value = ytCfg.spend_usd || 0;
            lastHolding.querySelector('.yt-multiplier').value = ytCfg.multiplier || 1;
            lastHolding.querySelector('.yt-entry-day').value = ytCfg.entry_day || 0;
            const priceMode = ytCfg.yt_price_mode || 'stepwise_linear';
            lastHolding.querySelector('.yt-price-mode').value = priceMode;
            lastHolding.querySelector('.yt-step-days').value = ytCfg.step_days || 7;
            
            // Show/hide campaign settings based on price mode
            const campaignSettings = lastHolding.querySelector('.campaign-settings');
            if (priceMode === 'two_phase' || ytCfg.campaign_enabled) {
                campaignSettings.style.display = 'block';
                lastHolding.querySelector('.yt-campaign-end-day').value = ytCfg.campaign_end_day || 0;
                lastHolding.querySelector('.yt-pre-mode').value = ytCfg.pre_mode || 'flat';
                lastHolding.querySelector('.yt-post-mode').value = ytCfg.post_mode || 'linear_to_zero';
                lastHolding.querySelector('.yt-post-discount').value = (ytCfg.post_discount || 0) * 100;
            }
        });
    }
    
    // Other settings
    if (config.timeWeighting !== undefined) document.getElementById('timeWeighting').checked = config.timeWeighting;
    if (config.fdvList !== undefined) {
        const fdvStr = config.fdvList.map(f => f / 1000000).join(',');
        document.getElementById('fdvList').value = fdvStr;
    }
    if (config.runTimingSweep !== undefined) document.getElementById('runTimingSweep').checked = config.runTimingSweep;
    if (config.entryDaysToTest !== undefined && config.entryDaysToTest) {
        document.getElementById('entryDaysToTest').value = config.entryDaysToTest.join(',');
    }
    
    initializeTooltips(); // Reinitialize tooltips
}

// Page navigation functions
function navigatePage(direction) {
    if (direction === -1 && currentPage === 1) {
        // Go back to welcome page
        const welcomePage = document.getElementById('welcomePage');
        const configNavigation = document.getElementById('configNavigation');
        const mainContent = document.getElementById('mainContent');
        
        welcomePage.style.display = 'block';
        configNavigation.style.display = 'none';
        mainContent.style.display = 'none';
        return;
    }
    
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updatePageNavigation();
    }
}

function updatePageNavigation() {
    // Hide all pages
    document.querySelectorAll('.config-page').forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show current page
    const currentPageElement = document.querySelector(`.config-page[data-page="${currentPage}"]`);
    if (currentPageElement) {
        currentPageElement.classList.add('active');
        currentPageElement.style.display = 'block';
    }
    
    // Update page indicator
    const pageTitle = currentPageElement?.getAttribute('data-page-title') || '';
    const pageInfo = currentPageElement?.getAttribute('data-page-info') || '';
    
    document.getElementById('currentPageTitle').textContent = pageTitle;
    const infoTooltip = document.querySelector('.page-info-tooltip-nav');
    if (infoTooltip) {
        infoTooltip.textContent = pageInfo;
    }
    
    document.getElementById('currentPageNum').textContent = currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    // Update navigation buttons - on first page, prev button goes to welcome page (not disabled)
    document.getElementById('prevPageBtn').disabled = false;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    
    // Show calculate button only on last page
    const calculateContainer = document.getElementById('calculateButtonContainer');
    if (currentPage === totalPages) {
        calculateContainer.style.display = 'block';
    } else {
        calculateContainer.style.display = 'none';
    }
    
    // Update TVL mode visibility when Protocol TVL page is shown
    if (currentPage === 2) {
        const tvlMode = document.getElementById('tvlMode');
        if (tvlMode) {
            const tvlAverageGroup = document.getElementById('tvlAverageGroup');
            const tvlInitialGroup = document.getElementById('tvlInitialGroup');
            const tvlFinalGroup = document.getElementById('tvlFinalGroup');
            const mode = tvlMode.value;
            if (mode === 'average') {
                if (tvlAverageGroup) tvlAverageGroup.style.display = 'block';
                if (tvlInitialGroup) tvlInitialGroup.style.display = 'none';
                if (tvlFinalGroup) tvlFinalGroup.style.display = 'none';
            } else {
                if (tvlAverageGroup) tvlAverageGroup.style.display = 'none';
                if (tvlInitialGroup) tvlInitialGroup.style.display = 'block';
                if (tvlFinalGroup) tvlFinalGroup.style.display = 'block';
            }
        }
    }
    
    // Update Pendle share mode visibility when Pendle Settings page is shown
    if (currentPage === 3) {
        const pendleMode = document.getElementById('pendleMode');
        const pendleShareMode = document.getElementById('pendleShareMode');
        if (pendleMode && pendleMode.value === 'simple' && pendleShareMode) {
            pendleShareMode.dispatchEvent(new Event('change'));
        }
    }
}

