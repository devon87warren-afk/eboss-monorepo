# component

Generate a new React component with proper TypeScript types and project structure.

## Instructions

You are helping create a new React component for the EBOSS-Manager project.

### Steps:

1. **Analyze the component name** provided by the user
   - Parse the name (e.g., "UserProfileCard")
   - Determine appropriate file location in `components/`
   - Check if similar components exist

2. **Review existing patterns:**
   - Read 2-3 existing components from `components/` directory
   - Note the project's component structure
   - Identify common patterns (props interfaces, styling approach, imports)

3. **Create the component file:**
   - File location: `components/<ComponentName>.tsx`
   - Include proper TypeScript interface for props
   - Add necessary imports (React, types, utilities)
   - Follow project's naming conventions
   - Use Tailwind CSS for styling if applicable

4. **Component structure template:**
```typescript
import React from 'react';

interface <ComponentName>Props {
  // Define props here
}

export const <ComponentName>: React.FC<<ComponentName>Props> = ({
  // Destructure props
}) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

5. **Add to index exports** if the project uses barrel exports

6. **Verify the component:**
   - Run TypeScript type check
   - Ensure no import errors
   - Confirm proper export

### Success Criteria:

- Component file created in correct location
- TypeScript types are properly defined
- Follows project's component patterns
- No type errors
- Properly exported

### Considerations:

- Ask the user about component purpose if unclear
- Suggest props based on component name
- Include accessibility attributes where appropriate
- Follow existing naming conventions
- Consider if the component should be in a subdirectory (e.g., `components/cards/`, `components/forms/`)

## Context

This skill generates new React components that follow the EBOSS-Manager project's structure and TypeScript conventions. Components should be consistent with existing patterns in the codebase.
