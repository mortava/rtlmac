import { NextRequest, NextResponse } from 'next/server';
import {
  parseQuery,
  getLoanLimits,
  getHousingPulse,
  getManufacturedHousing,
  getAMILookup,
  lookupLoan,
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
      case 'loan_limits': {
        if (!params.state) {
          responseContent = `I'd be happy to help you look up conforming loan limits. Could you please specify which state you're interested in? For example, you can ask:\n\n- "What are the loan limits in CA?"\n- "Show me conforming limits for Los Angeles County, California"\n- "Loan limits in Texas"`;
        } else {
          const result = await getLoanLimits(params.state, params.county);
          data = result.data;

          responseContent = `## 2024 Conforming Loan Limits for ${data.state}${data.county !== 'All Counties' ? `, ${data.county} County` : ''}\n\n`;
          responseContent += `| Property Units | Limit |\n|---|---|\n`;
          responseContent += `| 1-Unit | $${data.limits.oneUnit.toLocaleString()} |\n`;
          responseContent += `| 2-Unit | $${data.limits.twoUnit.toLocaleString()} |\n`;
          responseContent += `| 3-Unit | $${data.limits.threeUnit.toLocaleString()} |\n`;
          responseContent += `| 4-Unit | $${data.limits.fourUnit.toLocaleString()} |\n\n`;
          responseContent += `*Source: ${data.source}*\n\n`;
          responseContent += `Would you like me to check eligibility for a specific loan amount, or look up limits for another area?`;
        }
        break;
      }

      case 'housing_pulse': {
        const result = await getHousingPulse({ state: params.state || undefined });
        data = result.data;

        responseContent = `## Housing Market Pulse${params.state ? ` - ${params.state}` : ' - National'}\n`;
        responseContent += `*As of ${data.date}*\n\n`;
        responseContent += `### Key Metrics\n\n`;
        responseContent += `| Metric | Value |\n|---|---|\n`;
        responseContent += `| Median Home Price | $${data.metrics.medianHomePrice.toLocaleString()} |\n`;
        responseContent += `| YoY Price Change | ${data.metrics.homePriceYoY.toFixed(1)}% |\n`;
        responseContent += `| Inventory (months) | ${data.metrics.inventoryMonths.toFixed(1)} |\n`;
        responseContent += `| Days on Market | ${data.metrics.daysOnMarket} |\n`;
        responseContent += `| 30-Yr Mortgage Rate | ${data.metrics.mortgageRate30Yr.toFixed(2)}% |\n`;
        responseContent += `| 15-Yr Mortgage Rate | ${data.metrics.mortgageRate15Yr.toFixed(2)}% |\n`;
        responseContent += `| Affordability Index | ${data.metrics.affordabilityIndex} |\n\n`;
        responseContent += `### Market Trends\n`;
        responseContent += `- **Price Direction:** ${data.trends.priceDirection}\n`;
        responseContent += `- **Inventory Direction:** ${data.trends.inventoryDirection}\n`;
        responseContent += `- **Demand Level:** ${data.trends.demandLevel}\n\n`;
        responseContent += `*Source: ${data.source}*`;
        break;
      }

      case 'ami_lookup': {
        if (!params.income || !params.state) {
          responseContent = `I can help you check HomeReady eligibility based on Area Median Income (AMI). Please provide:\n\n1. **Annual Income** - The borrower's total household income\n2. **State** - Two-letter state code (e.g., CA, TX)\n3. **County** (optional) - For more accurate results\n\nExample: "Is $75,000 income eligible for HomeReady in Los Angeles County, CA?"`;
        } else {
          const result = await getAMILookup({
            state: params.state,
            county: params.county || 'Metro',
            income: params.income,
          });
          data = result.data;

          responseContent = `## HomeReady / AMI Eligibility Analysis\n\n`;
          responseContent += `| Parameter | Value |\n|---|---|\n`;
          responseContent += `| Location | ${data.county}, ${data.state} |\n`;
          responseContent += `| Area Median Income (AMI) | $${data.areaMedianIncome.toLocaleString()} |\n`;
          responseContent += `| Borrower Income | $${data.borrowerIncome.toLocaleString()} |\n`;
          responseContent += `| % of AMI | ${data.amiPercentage}% |\n\n`;

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

          responseContent += `**Eligible Programs:** ${data.eligiblePrograms.join(', ')}\n\n`;
          responseContent += `${data.message}`;
        }
        break;
      }

      case 'manufactured_housing': {
        const result = await getManufacturedHousing(params.state);
        data = result.data;

        if (params.state && data.state) {
          responseContent = `## Manufactured Housing Data - ${data.state}\n\n`;
          responseContent += `| Metric | Value |\n|---|---|\n`;
          responseContent += `| Communities | ${data.communityCount.toLocaleString()} |\n`;
          responseContent += `| Total Units | ${data.unitCount.toLocaleString()} |\n`;
          responseContent += `| Avg Units/Community | ${data.avgUnitsPerCommunity} |\n`;
        } else {
          responseContent = `## National Manufactured Housing Overview\n\n`;
          responseContent += `### National Totals\n`;
          responseContent += `- **Total Communities:** ${data.nationalTotal.communities.toLocaleString()}\n`;
          responseContent += `- **Total Units:** ${data.nationalTotal.units.toLocaleString()}\n`;
          responseContent += `- **States Covered:** ${data.nationalTotal.states}\n\n`;
          responseContent += `### Top States by Community Count\n\n`;
          responseContent += `| State | Communities | Units |\n|---|---|---|\n`;
          data.topStates.forEach((s: any) => {
            responseContent += `| ${s.state} | ${s.communities.toLocaleString()} | ${s.units.toLocaleString()} |\n`;
          });
        }
        break;
      }

      case 'loan_lookup': {
        responseContent = `## Loan Lookup Service\n\n`;
        responseContent += `I can help you determine if a loan is owned by Fannie Mae. To perform a lookup, I'll need:\n\n`;
        responseContent += `1. **Borrower's Last Name**\n`;
        responseContent += `2. **Property Address** (street, city, state, zip)\n`;
        responseContent += `3. **Last 4 digits of SSN** (optional, for more accurate results)\n\n`;
        responseContent += `This service helps verify loan ownership for various purposes including:\n`;
        responseContent += `- Refinance eligibility\n`;
        responseContent += `- Modification programs\n`;
        responseContent += `- Servicing transfers\n\n`;
        responseContent += `Please provide the borrower details to proceed.`;
        break;
      }

      default: {
        // General response - provide helpful information about available features
        responseContent = `# Welcome to RTLMAC - Real-Time Lending Machine AI Companion\n\n`;
        responseContent += `I'm your AI-powered assistant for accessing Fannie Mae property and lending data. Here's what I can help you with:\n\n`;
        responseContent += `## 📊 Available Data Services\n\n`;
        responseContent += `### 1. Loan Limits\n`;
        responseContent += `Get current conforming loan limits by state and county.\n`;
        responseContent += `*Example: "What are the loan limits in California?"*\n\n`;
        responseContent += `### 2. Housing Market Pulse\n`;
        responseContent += `Access real-time housing market metrics including prices, inventory, and rates.\n`;
        responseContent += `*Example: "Show me the housing market data for Texas"*\n\n`;
        responseContent += `### 3. HomeReady/AMI Eligibility\n`;
        responseContent += `Check if a borrower qualifies for affordable lending programs.\n`;
        responseContent += `*Example: "Is $65,000 income eligible for HomeReady in FL?"*\n\n`;
        responseContent += `### 4. Manufactured Housing Data\n`;
        responseContent += `Explore manufactured housing community statistics.\n`;
        responseContent += `*Example: "Show manufactured housing data for Arizona"*\n\n`;
        responseContent += `### 5. Loan Lookup\n`;
        responseContent += `Check if a loan is owned by Fannie Mae.\n`;
        responseContent += `*Example: "Look up a loan"*\n\n`;
        responseContent += `---\n\n`;
        responseContent += `**How can I assist you today?** Just type your question in natural language!`;
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
