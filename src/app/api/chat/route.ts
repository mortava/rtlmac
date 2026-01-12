import { NextRequest, NextResponse } from 'next/server';
import {
  parseQuery,
  getLoanLimits,
  getHousingPulse,
  getManufacturedHousing,
  amiLookup,
  loanLookup,
  getLoanPricing,
  getMissionScore,
  getSRPPricing,
  evaluateMITermination,
  checkHiLoEligibility,
  submitPropertyData,
  getAppraisalFindings,
  getDUMessages,
  getOpportunityZones,
  getInvestorData,
  getBuyUpBuyDown,
  API_CATALOG,
} from '@/lib/fanniemae';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Parse the user's query to determine intent
    const { type, params } = parseQuery(message);

    let responseContent = '';
    let data = null;

    switch (type) {
      // ============================================
      // PUBLIC APIs
      // ============================================

      case 'loan_limits': {
        if (!params.state) {
          responseContent = `I'd be happy to help you look up conforming loan limits. Could you please specify which state you're interested in? For example, you can ask:\n\n- "What are the loan limits in CA?"\n- "Show me conforming limits for Los Angeles County, California"\n- "Loan limits in Texas"`;
        } else {
          const result = await getLoanLimits({ state: params.state, county: params.county });
          data = result;

          responseContent = `## 2025 Conforming Loan Limits for ${data.state}${data.county !== 'All Counties' ? `, ${data.county} County` : ''}\n\n`;
          responseContent += `| Property Units | Limit |\n|---|---|\n`;
          responseContent += `| 1-Unit | $${data.limits.oneUnit.toLocaleString()} |\n`;
          responseContent += `| 2-Unit | $${data.limits.twoUnit.toLocaleString()} |\n`;
          responseContent += `| 3-Unit | $${data.limits.threeUnit.toLocaleString()} |\n`;
          responseContent += `| 4-Unit | $${data.limits.fourUnit.toLocaleString()} |\n\n`;
          if (data.highCostArea) {
            responseContent += `🏠 **High-Cost Area** - Higher limits apply\n\n`;
          }
          responseContent += `*Source: ${data.source} | Effective: ${data.effectiveDate}*\n\n`;
          responseContent += `Would you like me to check eligibility for a specific loan amount, or look up limits for another area?`;
        }
        break;
      }

      case 'housing_pulse': {
        const result = await getHousingPulse({ state: params.state || undefined });
        data = result;

        responseContent = `## Housing Market Pulse${params.state ? ` - ${params.state}` : ' - National'}\n`;
        responseContent += `*As of ${data.dataDate}*\n\n`;
        responseContent += `### Key Metrics\n\n`;
        responseContent += `| Metric | Value |\n|---|---|\n`;
        responseContent += `| Median Home Price | $${data.metrics.medianHomePrice.toLocaleString()} |\n`;
        responseContent += `| YoY Price Change | ${data.metrics.homePriceYoY.toFixed(1)}% |\n`;
        responseContent += `| Inventory (months) | ${data.metrics.inventoryMonths.toFixed(1)} |\n`;
        responseContent += `| Days on Market | ${data.metrics.daysOnMarket} |\n`;
        responseContent += `| 30-Yr Mortgage Rate | ${data.metrics.mortgageRate30Yr.toFixed(2)}% |\n`;
        responseContent += `| 15-Yr Mortgage Rate | ${data.metrics.mortgageRate15Yr.toFixed(2)}% |\n`;
        responseContent += `| Affordability Index | ${data.metrics.affordabilityIndex} |\n`;
        responseContent += `| New Listings | ${data.metrics.newListings.toLocaleString()} |\n`;
        responseContent += `| Pending Sales | ${data.metrics.pendingSales.toLocaleString()} |\n`;
        responseContent += `| Closed Sales | ${data.metrics.closedSales.toLocaleString()} |\n\n`;
        responseContent += `### Market Trends\n`;
        responseContent += `- **Price Direction:** ${data.trends.priceDirection}\n`;
        responseContent += `- **Inventory Direction:** ${data.trends.inventoryDirection}\n`;
        responseContent += `- **Demand Level:** ${data.trends.demandLevel}\n`;
        responseContent += `- **Market Temperature:** ${data.trends.marketTemperature}\n\n`;
        responseContent += `*Source: ${data.source}*`;
        break;
      }

      case 'manufactured_housing': {
        const result = await getManufacturedHousing({ state: params.state });
        data = result;

        if (params.state && data.state) {
          responseContent = `## Manufactured Housing Data - ${data.state}\n\n`;
          responseContent += `| Metric | Value |\n|---|---|\n`;
          responseContent += `| Communities | ${data.communityCount.toLocaleString()} |\n`;
          responseContent += `| Total Units | ${data.unitCount.toLocaleString()} |\n`;
          responseContent += `| Avg Units/Community | ${data.avgUnitsPerCommunity} |\n\n`;
          responseContent += `*Source: ${data.source}*`;
        } else {
          responseContent = `## National Manufactured Housing Overview\n\n`;
          if (data.nationalTotals) {
            responseContent += `### National Totals\n`;
            responseContent += `- **Total Communities:** ${data.nationalTotals.totalCommunities.toLocaleString()}\n`;
            responseContent += `- **Total Units:** ${data.nationalTotals.totalUnits.toLocaleString()}\n`;
            responseContent += `- **States Reporting:** ${data.nationalTotals.statesReporting}\n\n`;
          }
          if (data.stateBreakdown) {
            responseContent += `### Top States by Community Count\n\n`;
            responseContent += `| State | Communities | Units | Avg/Community |\n|---|---|---|---|\n`;
            data.stateBreakdown.forEach((s: any) => {
              responseContent += `| ${s.state} | ${s.communities.toLocaleString()} | ${s.units.toLocaleString()} | ${s.avgUnitsPerCommunity} |\n`;
            });
          }
          responseContent += `\n*Source: ${data.source}*`;
        }
        break;
      }

      case 'opportunity_zones': {
        const result = await getOpportunityZones({ state: params.state, county: params.county });
        data = result;

        responseContent = `## Opportunity Zones${params.state ? ` - ${params.state}` : ''}\n\n`;
        responseContent += `Found **${data.totalZones}** qualified opportunity zones.\n\n`;
        responseContent += `### Zone Details\n\n`;
        responseContent += `| Tract ID | Designation | Population | Poverty Rate | Median Income |\n|---|---|---|---|---|\n`;
        data.zones.forEach((zone: any) => {
          responseContent += `| ${zone.tractId} | ${zone.designation} | ${zone.population.toLocaleString()} | ${zone.povertyRate.toFixed(1)}% | $${zone.medianFamilyIncome.toLocaleString()} |\n`;
        });
        responseContent += `\n### Investment Benefits\n`;
        responseContent += `Opportunity Zones offer tax incentives for investments including:\n`;
        responseContent += `- Capital gains tax deferral\n`;
        responseContent += `- Step-up in basis after 5-7 years\n`;
        responseContent += `- Tax-free gains on new investments held 10+ years\n`;
        break;
      }

      case 'investor_tools': {
        const result = await getInvestorData({
          dataType: 'POOL_DATA',
          poolNumber: params.poolNumber,
          cusip: params.cusip
        });
        data = result;

        responseContent = `## Investor Data - ${data.dataType.replace('_', ' ').toUpperCase()}\n`;
        responseContent += `*As of ${data.asOfDate}*\n\n`;
        responseContent += `### Security Records\n\n`;
        responseContent += `| Pool # | CUSIP | Type | Coupon | WAC | WAM | Loan Count |\n|---|---|---|---|---|---|---|\n`;
        data.records.forEach((rec: any) => {
          responseContent += `| ${rec.poolNumber} | ${rec.cusip} | ${rec.securityType} | ${rec.couponRate.toFixed(2)}% | ${rec.wac.toFixed(2)}% | ${rec.wam} | ${rec.loanCount} |\n`;
        });
        responseContent += `\n**Total Records:** ${data.totalRecords}`;
        break;
      }

      // ============================================
      // ORIGINATING & UNDERWRITING APIs
      // ============================================

      case 'loan_lookup': {
        if (!params.borrowerLastName || !params.state) {
          responseContent = `## Loan Lookup Service\n\n`;
          responseContent += `I can help you determine if a loan is owned by Fannie Mae. To perform a lookup, I'll need:\n\n`;
          responseContent += `1. **Borrower's Last Name**\n`;
          responseContent += `2. **Property Address** (street, city, state, zip)\n`;
          responseContent += `3. **Last 4 digits of SSN** (optional, for more accurate results)\n\n`;
          responseContent += `This service helps verify loan ownership for various purposes including:\n`;
          responseContent += `- Refinance eligibility\n`;
          responseContent += `- Modification programs\n`;
          responseContent += `- Servicing transfers\n\n`;
          responseContent += `Please provide the borrower details to proceed.\n\n`;
          responseContent += `*Example: "Look up loan for borrower Smith at 123 Main St, Austin TX 78701"*`;
        } else {
          const result = await loanLookup({
            referenceIdentifier: `lookup-${Date.now()}`,
            borrowerLastName: params.borrowerLastName,
            propertyStreetAddress: params.propertyAddress || '',
            propertyCity: params.city || '',
            propertyState: params.state,
            propertyZipCode: params.zipCode || '',
          });
          data = result;

          responseContent = `## Loan Lookup Results\n\n`;
          if (data.ownedByFannieMae) {
            responseContent += `### ✅ Loan Found in Fannie Mae Portfolio\n\n`;
            responseContent += `| Detail | Value |\n|---|---|\n`;
            responseContent += `| Fannie Mae Loan # | ${data.fannieMaeLoanNumber} |\n`;
            responseContent += `| Servicer | ${data.servicerName} |\n`;
            responseContent += `| Current UPB | $${data.currentUPB?.toLocaleString()} |\n`;
            responseContent += `| Note Rate | ${data.noteRate?.toFixed(3)}% |\n`;
            responseContent += `| Eligible for Refi | ${data.eligibleForRefi ? 'Yes' : 'No'} |\n`;
            responseContent += `| Appraisal Waiver | ${data.eligibleForAppraisalWaiver ? 'May qualify' : 'Not eligible'} |\n\n`;
          } else {
            responseContent += `### ℹ️ Loan Not Found\n\n`;
            responseContent += `This loan does not appear to be owned by Fannie Mae.\n\n`;
            responseContent += `The loan may be:\n`;
            responseContent += `- Owned by Freddie Mac\n`;
            responseContent += `- A portfolio loan\n`;
            responseContent += `- A government loan (FHA/VA/USDA)\n`;
          }
          responseContent += `*${data.message}*`;
        }
        break;
      }

      case 'ami_homeready': {
        if (!params.income || !params.state) {
          responseContent = `I can help you check HomeReady eligibility based on Area Median Income (AMI). Please provide:\n\n1. **Annual Income** - The borrower's total household income\n2. **State** - Two-letter state code (e.g., CA, TX)\n3. **County** (optional) - For more accurate results\n\nExample: "Is $75,000 income eligible for HomeReady in Los Angeles County, CA?"`;
        } else {
          const result = await amiLookup({
            referenceIdentifier: `ami-${Date.now()}`,
            propertyState: params.state,
            propertyCounty: params.county || 'Metro',
            borrowerIncome: params.income,
          });
          data = result;

          responseContent = `## HomeReady / AMI Eligibility Analysis\n\n`;
          responseContent += `| Parameter | Value |\n|---|---|\n`;
          responseContent += `| Location | ${params.county || 'Metro'}, ${params.state} |\n`;
          responseContent += `| Area Median Income (AMI) | $${data.areaMedianIncome.toLocaleString()} |\n`;
          responseContent += `| Borrower Income | $${params.income.toLocaleString()} |\n`;
          responseContent += `| % of AMI | ${data.amiPercentage}% |\n`;
          responseContent += `| 80% AMI Limit | $${data.incomeLimit80AMI.toLocaleString()} |\n\n`;

          if (data.homeReadyEligible) {
            responseContent += `### ✅ HomeReady Eligible!\n\n`;
            responseContent += `Great news! The borrower qualifies for Fannie Mae's HomeReady program, which offers:\n`;
            responseContent += `- Down payments as low as 3%\n`;
            responseContent += `- Reduced MI coverage requirements\n`;
            responseContent += `- Flexible income sources (boarder income, rental income)\n\n`;
          } else {
            responseContent += `### ℹ️ Not HomeReady Eligible\n\n`;
            responseContent += `The borrower's income exceeds 80% of AMI for this area.\n\n`;
          }

          responseContent += `**Eligible Programs:**\n`;
          data.eligiblePrograms.forEach((prog: any) => {
            responseContent += `- ${prog.programName}${prog.eligible ? ' ✓' : ''}\n`;
          });
        }
        break;
      }

      case 'property_data': {
        responseContent = `## Property Data (UPD) Submission\n\n`;
        responseContent += `The Uniform Property Dataset (UPD) service allows lenders to submit property data for:\n\n`;
        responseContent += `- **Property Valuation** - Get automated property values\n`;
        responseContent += `- **Appraisal Data** - Submit appraisal information\n`;
        responseContent += `- **Collateral Analysis** - Property risk assessment\n\n`;
        responseContent += `### Required Information\n`;
        responseContent += `- Property Address (street, city, state, zip)\n`;
        responseContent += `- Property Type (SFR, Condo, PUD, etc.)\n`;
        responseContent += `- Legal Description\n`;
        responseContent += `- Sale/Contract Price (if applicable)\n\n`;
        responseContent += `Would you like to submit property data for valuation?`;
        break;
      }

      case 'appraisal_findings': {
        responseContent = `## Appraisal Findings & CU Score\n\n`;
        responseContent += `The Collateral Underwriter (CU) provides automated appraisal risk assessment.\n\n`;
        responseContent += `### CU Risk Score Scale\n`;
        responseContent += `| Score | Risk Level | Typical Action |\n|---|---|---|\n`;
        responseContent += `| 1.0-2.5 | Low | Minimal review needed |\n`;
        responseContent += `| 2.5-3.5 | Medium | Standard review |\n`;
        responseContent += `| 3.5-5.0 | High | Enhanced review required |\n\n`;
        responseContent += `### What CU Evaluates\n`;
        responseContent += `- Value consistency with market data\n`;
        responseContent += `- Comparable selection quality\n`;
        responseContent += `- Adjustment reasonableness\n`;
        responseContent += `- Market condition accuracy\n\n`;
        responseContent += `To get appraisal findings, I'll need a **Document File ID** from your submission.`;
        break;
      }

      case 'du_messages': {
        responseContent = `## Desktop Underwriter (DU) Messages\n\n`;
        responseContent += `DU provides automated underwriting recommendations and findings.\n\n`;
        responseContent += `### DU Recommendations\n`;
        responseContent += `| Recommendation | Description |\n|---|---|\n`;
        responseContent += `| Approve/Eligible | Meets GSE standards |\n`;
        responseContent += `| Approve/Ineligible | Meets credit standards but has eligibility issue |\n`;
        responseContent += `| Refer/Eligible | Needs manual underwriting |\n`;
        responseContent += `| Refer with Caution | Higher risk, manual review required |\n`;
        responseContent += `| Out of Scope | Cannot be processed by DU |\n\n`;
        responseContent += `To retrieve DU messages, I'll need a **Casefile ID** from your DU submission.`;
        break;
      }

      // ============================================
      // PRICING & EXECUTION APIs
      // ============================================

      case 'loan_pricing': {
        if (!params.loanAmount || !params.creditScore) {
          responseContent = `## Loan Pricing Service\n\n`;
          responseContent += `I can calculate comprehensive loan pricing including LLPAs and SRPs. Please provide:\n\n`;
          responseContent += `### Required Information\n`;
          responseContent += `- **Loan Amount** (e.g., $400,000)\n`;
          responseContent += `- **Credit Score** (e.g., 740)\n`;
          responseContent += `- **LTV** (e.g., 80%)\n`;
          responseContent += `- **Loan Purpose** (Purchase, Rate/Term Refi, Cash-out)\n\n`;
          responseContent += `### Optional Parameters\n`;
          responseContent += `- Property Type, Occupancy, State\n`;
          responseContent += `- Lock Period, Product Type\n\n`;
          responseContent += `*Example: "Get pricing for $350,000 loan, 720 credit score, 85% LTV, purchase"*`;
        } else {
          const result = await getLoanPricing({
            referenceIdentifier: `pricing-${Date.now()}`,
            loanAmount: params.loanAmount,
            noteRate: params.noteRate || 6.5,
            loanTerm: 360,
            creditScore: params.creditScore,
            ltv: params.ltv || 80,
            cltv: params.ltv || 80,
            loanPurpose: params.purpose || 'PURCHASE',
            propertyType: params.propertyType || 'SINGLE_FAMILY',
            occupancyType: 'PRIMARY_RESIDENCE',
            propertyState: params.state || 'CA',
            propertyCounty: params.county || 'Los Angeles',
            deliveryType: 'CASH',
          });
          data = result;

          responseContent = `## Loan Pricing Analysis\n`;
          responseContent += `*Pricing Date: ${data.pricingDate}*\n\n`;
          responseContent += `### Price Summary\n`;
          responseContent += `| Component | Value |\n|---|---|\n`;
          responseContent += `| Base Price | ${data.basePrice.toFixed(3)} |\n`;
          responseContent += `| Adjusted Price | ${data.adjustedPrice.toFixed(3)} |\n`;
          responseContent += `| SRP Price | ${data.srpPrice.toFixed(3)} |\n`;
          responseContent += `| **Net Price** | **${data.netPrice.toFixed(3)}** |\n\n`;

          responseContent += `### LLPA Details\n`;
          responseContent += `| Adjustment | Factor | Value |\n|---|---|---|\n`;
          data.llpaDetails.forEach((llpa: any) => {
            responseContent += `| ${llpa.adjustmentName} | ${llpa.riskFactor} | ${llpa.adjustmentValue >= 0 ? '+' : ''}${llpa.adjustmentValue.toFixed(3)} |\n`;
          });

          responseContent += `\n**Eligibility:** ${data.eligibilityStatus}\n`;
          if (data.eligibilityMessages?.length) {
            data.eligibilityMessages.forEach((msg: string) => {
              responseContent += `- ${msg}\n`;
            });
          }
        }
        break;
      }

      case 'mission_score': {
        if (!params.state) {
          responseContent = `## Mission Score Calculator\n\n`;
          responseContent += `Mission Score evaluates loans for affordable and sustainable lending goals.\n\n`;
          responseContent += `### Score Levels\n`;
          responseContent += `| Score | Description | Incentives |\n|---|---|---|\n`;
          responseContent += `| 3 | High Mission | Maximum LLPA credits |\n`;
          responseContent += `| 2 | Moderate Mission | Standard incentives |\n`;
          responseContent += `| 1 | Low Mission | Minimal incentives |\n`;
          responseContent += `| 0 | Not Mission | No incentives |\n\n`;
          responseContent += `### Criteria Evaluated\n`;
          responseContent += `- First-time homebuyer status\n`;
          responseContent += `- Income relative to AMI\n`;
          responseContent += `- Property location (underserved areas)\n`;
          responseContent += `- Affordable housing initiatives\n\n`;
          responseContent += `*Provide loan details including state, income, and property info for scoring.*`;
        } else {
          const result = await getMissionScore({
            referenceIdentifier: `mission-${Date.now()}`,
            loanAmount: params.loanAmount || 350000,
            propertyState: params.state,
            propertyCounty: params.county || 'Metro',
            propertyZipCode: params.zipCode || '00000',
            borrowerIncome: params.income || 75000,
          });
          data = result;

          responseContent = `## Mission Score Results\n\n`;
          responseContent += `### Overall Score: ${data.missionScore}/3 ${data.missionScore >= 2 ? '🌟' : ''}\n\n`;
          responseContent += `| Metric | Value |\n|---|---|\n`;
          responseContent += `| Mission Criteria Share | ${data.missionCriteriaShare.toFixed(1)}% |\n`;
          responseContent += `| Mission Density Score | ${data.missionDensityScore.toFixed(1)} |\n\n`;

          responseContent += `### Component Scores\n`;
          data.componentScores?.forEach((comp: any) => {
            responseContent += `**${comp.dimension}**: ${comp.score.toFixed(0)}/100\n`;
            responseContent += `- Criteria Met: ${comp.criteriaMetCount}/${comp.totalCriteria}\n`;
            if (comp.criteriaMet?.length) {
              comp.criteriaMet.forEach((c: string) => responseContent += `  - ${c}\n`);
            }
            responseContent += `\n`;
          });

          if (data.eligibleForIncentives) {
            responseContent += `### ✅ Eligible for Incentives\n`;
            data.incentiveDetails?.forEach((inc: any) => {
              responseContent += `- **${inc.incentiveType}**: ${inc.incentiveValue} - ${inc.description}\n`;
            });
          }
        }
        break;
      }

      case 'srp_pricing': {
        responseContent = `## SRP (Servicing Released Premium) Pricing\n\n`;
        responseContent += `SRP pricing determines the premium paid for selling servicing rights.\n\n`;

        const result = await getSRPPricing({
          referenceIdentifier: `srp-${Date.now()}`,
          loanAmount: params.loanAmount || 300000,
          noteRate: params.noteRate || 6.5,
          loanTerm: 360,
          loanPurpose: 'PURCHASE',
          propertyType: 'SINGLE_FAMILY',
          occupancyType: 'PRIMARY_RESIDENCE',
          ltv: params.ltv || 80,
          creditScore: params.creditScore || 740,
          servicingRetained: false,
        });
        data = result;

        responseContent += `### SRP Quote\n`;
        responseContent += `| Component | Value |\n|---|---|\n`;
        responseContent += `| Indicative SRP Price | ${data.srpIndicativePrice.toFixed(3)} |\n`;
        responseContent += `| Price Date | ${data.srpPriceDate} |\n`;
        responseContent += `| Servicing Value | ${data.servicingValue.toFixed(3)} |\n\n`;

        responseContent += `### Price Breakdown\n`;
        data.priceBreakdown?.forEach((comp: any) => {
          responseContent += `- **${comp.component}**: ${comp.value.toFixed(3)} - ${comp.description}\n`;
        });

        responseContent += `\n### Commitment Options\n`;
        responseContent += `| Period (Days) | Price | Expiration |\n|---|---|---|\n`;
        data.commitmentOptions?.forEach((opt: any) => {
          responseContent += `| ${opt.commitmentPeriod} | ${opt.price.toFixed(3)} | ${opt.expirationDate.split('T')[0]} |\n`;
        });
        break;
      }

      // ============================================
      // SERVICING APIs
      // ============================================

      case 'mi_termination': {
        responseContent = `## MI (Mortgage Insurance) Termination\n\n`;
        responseContent += `I can evaluate whether a loan qualifies for MI termination.\n\n`;
        responseContent += `### Termination Types\n`;
        responseContent += `| Type | LTV Threshold | Process |\n|---|---|---|\n`;
        responseContent += `| Automatic | ≤78% | Servicer must cancel |\n`;
        responseContent += `| Borrower Requested | ≤80% | Borrower initiates |\n`;
        responseContent += `| Final | Midpoint of term | Automatic cancellation |\n\n`;
        responseContent += `### Requirements\n`;
        responseContent += `- Current on mortgage payments\n`;
        responseContent += `- Good payment history (no 30+ day late in 12 months)\n`;
        responseContent += `- LTV at or below threshold\n`;
        responseContent += `- Property value supports LTV calculation\n\n`;
        responseContent += `*Provide loan details to check MI termination eligibility.*`;
        break;
      }

      case 'hilo_eligibility': {
        responseContent = `## High LTV Refinance (RefiNow/HiLo) Eligibility\n\n`;
        responseContent += `The High LTV Refinance program helps underwater borrowers refinance.\n\n`;
        responseContent += `### Program Highlights\n`;
        responseContent += `| Feature | Detail |\n|---|---|\n`;
        responseContent += `| Max LTV | Up to 97% |\n`;
        responseContent += `| Max CLTV | Up to 105% |\n`;
        responseContent += `| Appraisal | Often waived |\n`;
        responseContent += `| Income Limit | ≤80% AMI |\n`;
        responseContent += `| Minimum Benefit | $50/month payment reduction |\n\n`;
        responseContent += `### Requirements\n`;
        responseContent += `- Loan must be owned by Fannie Mae\n`;
        responseContent += `- Current on payments (0x30 in 6 months, 1x30 in 12 months)\n`;
        responseContent += `- Original loan at least 12 months old\n`;
        responseContent += `- Must result in tangible benefit\n\n`;
        responseContent += `*Would you like to check a specific loan for HiLo eligibility?*`;
        break;
      }

      default: {
        // Build comprehensive help response with all available APIs
        responseContent = `# Welcome to RTLMAC - Real-Time Lending Machine AI Companion\n\n`;
        responseContent += `I'm your AI-powered assistant for accessing the complete Fannie Mae API ecosystem. Here's everything I can help you with:\n\n`;

        responseContent += `## 📊 Public Market Data\n\n`;
        responseContent += `| API | Description | Example |\n|---|---|---|\n`;
        responseContent += `| **Loan Limits** | Conforming limits by location | "Loan limits in California" |\n`;
        responseContent += `| **Housing Pulse** | Market metrics & trends | "Housing market data for Texas" |\n`;
        responseContent += `| **Manufactured Housing** | MH community statistics | "Manufactured housing in Florida" |\n`;
        responseContent += `| **Opportunity Zones** | Tax incentive zones | "Opportunity zones in Nevada" |\n`;
        responseContent += `| **Investor Tools** | MBS/Security data | "Show investor data for pool FN123456" |\n\n`;

        responseContent += `## 🏠 Originating & Underwriting\n\n`;
        responseContent += `| API | Description | Example |\n|---|---|---|\n`;
        responseContent += `| **Loan Lookup** | Check Fannie Mae ownership | "Is loan owned by Fannie Mae?" |\n`;
        responseContent += `| **AMI/HomeReady** | Income eligibility | "Is $70k income HomeReady eligible in TX?" |\n`;
        responseContent += `| **Property Data** | UPD submission | "Submit property data" |\n`;
        responseContent += `| **Appraisal/CU** | Collateral analysis | "Get appraisal findings" |\n`;
        responseContent += `| **DU Messages** | Underwriting findings | "Get DU messages" |\n\n`;

        responseContent += `## 💰 Pricing & Execution\n\n`;
        responseContent += `| API | Description | Example |\n|---|---|---|\n`;
        responseContent += `| **Loan Pricing** | LLPAs & pricing | "Get pricing for $400k loan, 740 score" |\n`;
        responseContent += `| **Mission Score** | Affordable lending score | "Calculate mission score" |\n`;
        responseContent += `| **SRP Pricing** | Servicing premiums | "Get SRP pricing" |\n`;
        responseContent += `| **Buy Up/Down** | Daily adjustments | "Show buy up buy down rates" |\n\n`;

        responseContent += `## 🔧 Servicing\n\n`;
        responseContent += `| API | Description | Example |\n|---|---|---|\n`;
        responseContent += `| **MI Termination** | Cancel mortgage insurance | "Check MI termination eligibility" |\n`;
        responseContent += `| **HiLo/RefiNow** | High LTV refi eligibility | "Check HiLo eligibility" |\n`;
        responseContent += `| **Expense Claims** | Servicer claims | "Submit expense claim" |\n`;
        responseContent += `| **Master Servicing** | Loan positions | "Get servicing position" |\n\n`;

        responseContent += `---\n\n`;
        responseContent += `**Just ask in natural language!** I'll route your request to the appropriate API and format the results for you.`;
      }
    }

    return NextResponse.json({
      success: true,
      content: responseContent,
      data,
      queryType: type,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
