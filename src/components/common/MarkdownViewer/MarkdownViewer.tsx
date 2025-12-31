import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ReactNode } from 'react'

interface MarkdownViewerProps {
  content: string
}

// Component to render AloAI with blue-red gradient
function StyledAloAI() {
  return (
    <span className="font-bold">
      <span className="text-blue-500">Alo</span>
      <span className="text-red-500">AI</span>
    </span>
  )
}

// Process text to replace AloAI with styled version
function processText(text: string): ReactNode[] {
  const parts = text.split(/(AloAI)/g)
  return parts.map((part, index) => 
    part === 'AloAI' ? <StyledAloAI key={index} /> : part
  )
}

// Custom paragraph component
function CustomParagraph({ children }: { children?: ReactNode }) {
  const processChildren = (child: ReactNode): ReactNode => {
    if (typeof child === 'string') {
      return processText(child)
    }
    return child
  }

  if (!children) return <p />

  return (
    <p>
      {Array.isArray(children) 
        ? children.map((child, i) => <span key={i}>{processChildren(child)}</span>)
        : processChildren(children)
      }
    </p>
  )
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none 
      prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold
      prose-h1:text-3xl prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:to-blue-400 prose-h1:bg-clip-text prose-h1:text-transparent
      prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-blue-600 dark:prose-h2:text-blue-400
      prose-h3:text-lg prose-h3:text-blue-500 dark:prose-h3:text-blue-300
      prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
      prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:marker:text-blue-500
      prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-semibold
      prose-table:border-collapse prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:text-blue-600 dark:prose-th:text-blue-400 prose-th:p-3 prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-700
      prose-td:p-3 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-700 prose-td:text-gray-700 dark:prose-td:text-gray-300
      prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      bg-white dark:bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl"
    >
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: CustomParagraph
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}


