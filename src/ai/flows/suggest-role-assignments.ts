'use server';

/**
 * @fileOverview An AI agent that suggests optimal role assignments for new menu options.
 *
 * - suggestRoleAssignments - A function that suggests role assignments based on menu options and user workflows.
 * - SuggestRoleAssignmentsInput - The input type for the suggestRoleAssignments function.
 * - SuggestRoleAssignmentsOutput - The return type for the suggestRoleAssignments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRoleAssignmentsInputSchema = z.object({
  menuOption: z.string().describe('The name or description of the new menu option.'),
  userWorkflows: z.string().describe('Description of typical user workflows.'),
});
export type SuggestRoleAssignmentsInput = z.infer<typeof SuggestRoleAssignmentsInputSchema>;

const SuggestRoleAssignmentsOutputSchema = z.object({
  suggestedRoles: z
    .array(z.string())
    .describe('An array of suggested user roles for the menu option.'),
  reasoning: z
    .string()
    .describe('Explanation of why these roles are suggested for the menu option.'),
});
export type SuggestRoleAssignmentsOutput = z.infer<typeof SuggestRoleAssignmentsOutputSchema>;

export async function suggestRoleAssignments(input: SuggestRoleAssignmentsInput): Promise<SuggestRoleAssignmentsOutput> {
  return suggestRoleAssignmentsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRoleAssignmentsPrompt',
  input: {schema: SuggestRoleAssignmentsInputSchema},
  output: {schema: SuggestRoleAssignmentsOutputSchema},
  prompt: `You are an expert in user access and security. You are provided with the new menu option and the user workflows.

  Based on this information, suggest the optimal user roles for this menu option.

  Menu Option: {{{menuOption}}}
  User Workflows: {{{userWorkflows}}}

  Consider user workflows and role responsibilities when suggesting roles. Provide a short explanation of your reasoning.
  Return the suggested roles, with the description, in JSON format.
`,
});

const suggestRoleAssignmentsFlow = ai.defineFlow(
  {
    name: 'suggestRoleAssignmentsFlow',
    inputSchema: SuggestRoleAssignmentsInputSchema,
    outputSchema: SuggestRoleAssignmentsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
