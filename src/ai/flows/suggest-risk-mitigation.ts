'use server';
/**
 * @fileOverview An AI agent that suggests risk mitigation strategies based on the type of finding and risk level.
 *
 * - suggestRiskMitigation - A function that handles the risk mitigation suggestion process.
 * - SuggestRiskMitigationInput - The input type for the suggestRiskMitigation function.
 * - SuggestRiskMitigationOutput - The return type for the suggestRiskMitigation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRiskMitigationInputSchema = z.object({
  findingDetails: z
    .string()
    .describe('The details of the audit finding.'),
  riskLevel: z.enum(['High', 'Medium', 'Low']).describe('The risk level associated with the finding.'),
});
export type SuggestRiskMitigationInput = z.infer<typeof SuggestRiskMitigationInputSchema>;

const SuggestRiskMitigationOutputSchema = z.object({
  mitigationSuggestions: z
    .array(z.string())
    .describe('An array of suggested risk mitigation strategies.'),
});
export type SuggestRiskMitigationOutput = z.infer<typeof SuggestRiskMitigationOutputSchema>;

export async function suggestRiskMitigation(input: SuggestRiskMitigationInput): Promise<SuggestRiskMitigationOutput> {
  return suggestRiskMitigationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRiskMitigationPrompt',
  input: {schema: SuggestRiskMitigationInputSchema},
  output: {schema: SuggestRiskMitigationOutputSchema},
  prompt: `You are an expert risk management consultant.

  Based on the audit finding details and the risk level, suggest common risk mitigation strategies.

  Finding Details: {{{findingDetails}}}
  Risk Level: {{{riskLevel}}}

  Provide at least three mitigation strategies.
  Ensure mitigation strategies are specific and actionable.
  Ensure mitigation strategies appropriately address the risk level.
  Responses should be in bulleted lists.
  Example format:
    {
      "mitigationSuggestions": [
        "Implement dual control for sensitive transactions.",
        "Conduct regular security awareness training for staff.",
        "Enhance monitoring of user access rights."
      ]
    }
  `,
});

const suggestRiskMitigationFlow = ai.defineFlow(
  {
    name: 'suggestRiskMitigationFlow',
    inputSchema: SuggestRiskMitigationInputSchema,
    outputSchema: SuggestRiskMitigationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
