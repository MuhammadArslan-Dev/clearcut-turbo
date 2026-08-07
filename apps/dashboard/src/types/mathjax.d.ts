declare global {
  interface Window {
    MathJax: {
      tex: {
        inlineMath: string[][]                      // Delimiters for inline math (e.g., [['$', '$']])
        displayMath: string[][]                   // Delimiters for display math (e.g., [['$$', '$$']])
        processEscapes: boolean             // Whether to process LaTeX escape sequences
        processEnvironments?: boolean // Whether to process LaTeX environments
        tags?: string                                   // Equation numbering style ('ams' for automatic numbering)
        tagSide?: string                             // Side for equation labels ('left' or 'right')
        tagIndent?: string                         // Indentation for equation labels
      }
      output: {
        font: string                  // Math font to use (e.g., 'mathjax-newcm')
        scale?: number          // Overall scaling factor for math
        minScale?: number   // Minimum scale factor
        maxScale?: number  // Maximum scale factor
      }
      startup: {
        pageReady: () => Promise<void>             // Function called when page is ready
        defaultPageReady: () => Promise<void> // Default page ready function
      }
      typesetPromise: (elements?: (Element | null)[]) => Promise<void>  // Function to render math elements
      loader?: {
        paths: { font: string }   // Paths for font loading
        load: string[]                // Extensions to load
      }
    }
  }
}

export {}