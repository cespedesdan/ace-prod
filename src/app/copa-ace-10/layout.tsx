import './copa-theme.css'

export default function CopaAce10Layout({ children }: { children: React.ReactNode }) {
  return <>{children}<noscript><style>{'@import url("/copa-ace-10/deferred-v1.css");'}</style></noscript></>
}
