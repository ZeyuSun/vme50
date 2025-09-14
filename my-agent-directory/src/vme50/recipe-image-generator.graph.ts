import { agent, agentGraph, mcpTool } from '@inkeep/agents-sdk';

// Placeholder MCP tool for analyzing recipe context and extracting steps
const analyzeRecipeContextTool = mcpTool({
  id: 'analyze-recipe-context-tool',
  name: 'Analyze Recipe Context Tool',
  description: 'Extracts detailed cooking steps and context from recipe data.',
  serverUrl: process.env.ANALYZE_MCP_URL || 'http://localhost:4100/mcp',
});

// Placeholder MCP tool for generating cooking step images
const generateCookingStepImageTool = mcpTool({
  id: 'generate-cooking-step-image-tool',
  name: 'Generate Cooking Step Image Tool',
  description: 'Generates realistic images for each cooking step using DALL-E 3 API.',
  serverUrl: process.env.IMAGE_MCP_URL || 'http://localhost:4101/mcp',
});


// Agent: Recipe Step Analyzer
const recipeStepAnalyzer = agent({
  id: 'recipe-step-analyzer',
  name: 'Recipe Step Analyzer',
  description: 'Extracts step-by-step cooking instructions and context from recipe data.',
  canUse: () => [analyzeRecipeContextTool],
  prompt: `You are a culinary assistant specializing in analyzing recipes. Your job is to process the provided recipe data and extract a detailed, structured list of cooking steps. For each step, provide a title and clear instructions. Return the steps as an array of objects with 'title' and 'instructions' fields.`,
});

// Agent: Cooking Image Generator
const cookingImageGenerator = agent({
  id: 'cooking-image-generator',
  name: 'Cooking Image Generator',
  description: 'Generates high-quality, realistic images for each cooking step.',
  canUse: () => [generateCookingStepImageTool],
  prompt: `You are an AI image generator focused on cooking. For each provided cooking step, generate a realistic image that visually represents the action or result described. Return the image as a URL or base64-encoded data.`,
});

// Agent: Recipe Coordinator
const recipeCoordinator = agent({
  id: 'recipe-coordinator',
  name: 'Recipe Coordinator',
  description: 'Coordinates the recipe analysis and image generation workflow.',
  canDelegateTo: () => [recipeStepAnalyzer, cookingImageGenerator],
  prompt: `You are the main coordinator for recipe image generation. When given a recipe, first delegate to the Recipe Step Analyzer to extract step-by-step instructions. Then, for each step, delegate to the Cooking Image Generator to create a realistic image. Return the complete recipe as an array of steps, each with: { title, instructions, imageUrl (preferred) or imageBase64, alt }. The 'alt' field should be a short description of the image for accessibility.`,
});


// Export the agent graph as a named const and default export
export const recipeImageGeneratorGraph = agentGraph({
  id: 'recipe-image-generator-graph',
  name: 'Recipe Image Generator Graph',
  defaultAgent: recipeCoordinator,
  agents: () => [recipeCoordinator, recipeStepAnalyzer, cookingImageGenerator],
});

export default recipeImageGeneratorGraph;
