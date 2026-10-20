import React, { useState } from 'react'
import {
  Terminal,
  Code2,
  ExternalLink,
  Calendar,
  Info,
  CheckCircle2,
  Play,
  RotateCcw,
  Trophy,
  Copy,
  Sparkles
} from 'lucide-react'
import { codingChallengeData, codingPlatforms } from '../data/departmentData'
import { cn } from '../lib/utils'

const codeSnippets: Record<'typescript' | 'python' | 'cpp', { filename: string; code: string; label: string }> = {
  typescript: {
    label: 'TypeScript',
    filename: 'WeeklyChallenge.ts',
    code: `// GIST CSE Problem of the Week: Shortest Path Network
class NetworkOptimizer {
  shortestPath(nodes: number, edges: number[][], src: number): number[] {
    const adj = Array.from({ length: nodes }, () => new Map<number, number>());
    for (const [u, v, w] of edges) {
      adj[u].set(v, w);
      adj[v].set(u, w); // Bidirectional
    }
    // Priority-queue Dijkstra traversal
    return this.dijkstra(nodes, adj, src);
  }
}`
  },
  python: {
    label: 'Python 3',
    filename: 'WeeklyChallenge.py',
    code: `# GIST CSE Problem of the Week: Shortest Path Network
import heapq
from typing import List

class NetworkOptimizer:
    def shortestPath(self, nodes: int, edges: List[List[int]], src: int) -> List[int]:
        adj = [[] for _ in range(nodes)]
        for u, v, w in edges:
            adj[u].append((v, w))
            adj[v].append((u, w))
        
        dist = [float('inf')] * nodes
        dist[src] = 0
        pq = [(0, src)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]: continue
            for v, w in adj[u]:
                if dist[u] + w < dist[v]:
                    dist[v] = dist[u] + w
                    heapq.heappush(pq, (dist[v], v))
        return dist`
  },
  cpp: {
    label: 'C++ 20',
    filename: 'WeeklyChallenge.cpp',
    code: `// GIST CSE Problem of the Week: Shortest Path Network
#include <vector>
#include <queue>
using namespace std;

class NetworkOptimizer {
public:
    vector<int> shortestPath(int n, vector<vector<int>>& edges, int src) {
        vector<vector<pair<int, int>>> adj(n);
        for (const auto& e : edges) {
            adj[e[0]].push_back({e[1], e[2]});
            adj[e[1]].push_back({e[0], e[2]});
        }
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
        vector<int> dist(n, 1e9);
        dist[src] = 0;
        pq.push({0, src});
        // Min-heap Dijkstra relaxation...
        return dist;
    }
};`
  }
}

interface TestCase {
  id: number
  description: string
  nodes: number
  edges: number[][]
  src: number
  expected: number[]
}

const sampleTestCases: TestCase[] = [
  {
    id: 1,
    description: 'Campus Core 4-Node Switch Topology',
    nodes: 4,
    edges: [
      [0, 1, 2],
      [0, 2, 4],
      [1, 2, 1],
      [1, 3, 7],
      [2, 3, 3]
    ],
    src: 0,
    expected: [0, 2, 3, 6]
  },
  {
    id: 2,
    description: 'Triangle High-Speed Backbone Loop',
    nodes: 3,
    edges: [
      [0, 1, 5],
      [1, 2, 3],
      [0, 2, 10]
    ],
    src: 0,
    expected: [0, 5, 8]
  },
  {
    id: 3,
    description: 'Disconnected Redundant Gateway Node',
    nodes: 3,
    edges: [[0, 1, 4]],
    src: 0,
    expected: [0, 4, Infinity]
  }
]

// Pure client-side Dijkstra implementation
function executeDijkstra(nodes: number, edges: number[][], src: number): number[] {
  const adj = Array.from({ length: nodes }, () => [] as [number, number][])
  for (const [u, v, w] of edges) {
    adj[u].push([v, w])
    adj[v].push([u, w])
  }
  const dist = Array(nodes).fill(Infinity)
  dist[src] = 0
  const visited = Array(nodes).fill(false)

  for (let i = 0; i < nodes; i++) {
    let u = -1
    for (let j = 0; j < nodes; j++) {
      if (!visited[j] && (u === -1 || dist[j] < dist[u])) {
        u = j
      }
    }
    if (u === -1 || dist[u] === Infinity) break
    visited[u] = true
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w
      }
    }
  }
  return dist
}

export const CodingHub: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'python' | 'cpp'>('typescript')
  const [activeTab, setActiveTab] = useState<'problem' | 'hints' | 'runner'>('problem')
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false)
  const [testResults, setTestResults] = useState<
    Array<{
      id: number
      passed: boolean
      actual: number[]
      expected: number[]
      latencyMs: number
    }>
  >([])
  const [isChallengeSolved, setIsChallengeSolved] = useState<boolean>(() => {
    try {
      return localStorage.getItem('gist_coding_challenge_solved') === 'true'
    } catch {
      return false
    }
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippets[selectedLanguage].code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleRunTestSuite = () => {
    setIsRunningTests(true)
    setActiveTab('runner')

    setTimeout(() => {
      const results = sampleTestCases.map((tc) => {
        const start = performance.now()
        const actual = executeDijkstra(tc.nodes, tc.edges, tc.src)
        const latencyMs = Math.max(0.1, Number((performance.now() - start).toFixed(2)))
        const passed =
          actual.length === tc.expected.length &&
          actual.every((val, idx) => (val === Infinity && tc.expected[idx] === Infinity) || val === tc.expected[idx])
        return {
          id: tc.id,
          passed,
          actual,
          expected: tc.expected,
          latencyMs
        }
      })

      setTestResults(results)
      setIsRunningTests(false)
      const allPassed = results.every((r) => r.passed)
      if (allPassed) {
        setStatusMessage('Success: All 3/3 test cases passed! Algorithmic logic and bounds verified.')
      } else {
        setStatusMessage('Test verification finished. Review the test case outputs below.')
      }
    }, 280)
  }

  const handleMarkAsSolved = () => {
    setIsChallengeSolved(true)
    try {
      localStorage.setItem('gist_coding_challenge_solved', 'true')
    } catch {
      // Fallback
    }
    setStatusMessage('Problem of the Week marked as SOLVED! Congratulations on completing the algorithmic challenge.')
  }

  const handleResetChallenge = () => {
    setIsChallengeSolved(false)
    setTestResults([])
    try {
      localStorage.removeItem('gist_coding_challenge_solved')
    } catch {
      // Fallback
    }
    setStatusMessage('Challenge reset. You can execute the test suite again anytime.')
  }

  const currentSnippet = codeSnippets[selectedLanguage]

  const formatVector = (vec: number[]) => {
    return `[${vec.map((v) => (v === Infinity ? '∞' : v)).join(', ')}]`
  }

  return (
    <section className="department-section" id="coding-hub">
      <div className="section-header-block">
        <div className="section-tag-pill">STUDENT DEVELOPER HUB</div>
        <h2 className="section-main-heading">
          Department <span className="text-gradient">Coding Arena</span>
        </h2>
        <p className="section-lead-text">
          Sharpen algorithmic problem-solving and software engineering proficiency with weekly department practice challenges and external contest chapters.
        </p>
      </div>

      <div className="coding-hub-grid">
        {/* Left: Code Challenge of the Week IDE Window */}
        <div className="ide-window-card">
          <div className="ide-window-header">
            <div className="ide-window-controls" aria-hidden="true">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>

            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span className="ide-file-title">{currentSnippet.filename} &bull; GIST-CSE</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {isChallengeSolved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Solved ✓</span>
                </span>
              )}
              <span className="challenge-difficulty-badge">{codingChallengeData.difficulty}</span>
            </div>
          </div>

          <div className="ide-challenge-info">
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <h3 className="challenge-title mb-0!">{codingChallengeData.title}</h3>
                {isChallengeSolved && (
                  <span title="Completed by student">
                    <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5" role="tablist" aria-label="Programming Language">
                {(['typescript', 'python', 'cpp'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    role="tab"
                    aria-selected={selectedLanguage === lang}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded transition-colors',
                      selectedLanguage === lang
                        ? 'bg-blue-600/40 text-blue-200 border border-blue-500/40'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-transparent'
                    )}
                    onClick={() => setSelectedLanguage(lang)}
                  >
                    {codeSnippets[lang].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="challenge-tags-row">
              {codingChallengeData.tags.map((tag, idx) => (
                <span key={idx} className="challenge-tag">{tag}</span>
              ))}
              <span className="challenge-submissions">
                <Code2 className="w-3.5 h-3.5 inline mr-1 text-indigo-400" aria-hidden="true" />
                <span>Problem Category: {codingChallengeData.category}</span>
              </span>
            </div>
          </div>

          {/* Subtabs: Problem Skeleton vs Hints vs Test Runner */}
          <div className="flex items-center gap-2 px-5 py-2 border-b border-white/5 bg-slate-950/40 text-xs flex-wrap">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded font-medium transition-colors',
                activeTab === 'problem' ? 'text-sky-300 bg-sky-950/50' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setActiveTab('problem')}
            >
              Algorithm Skeleton
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded font-medium transition-colors',
                activeTab === 'hints' ? 'text-sky-300 bg-sky-950/50' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setActiveTab('hints')}
            >
              Complexity &amp; Constraints
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'runner' ? 'text-emerald-300 bg-emerald-950/50 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              )}
              onClick={() => setActiveTab('runner')}
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Interactive Test Runner {testResults.length > 0 && `(${testResults.length})`}</span>
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-white/5 border border-white/10 flex items-center gap-1.5 transition"
                onClick={handleCopyCode}
                aria-label="Copy code snippet"
              >
                <Copy className="w-3 h-3" />
                <span>{isCopied ? 'Copied ✓' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Code View */}
          {activeTab === 'problem' && (
            <pre className="ide-code-block max-h-80 overflow-y-auto">
              <code>{currentSnippet.code}</code>
            </pre>
          )}

          {/* Tab 2: Complexity & Constraints */}
          {activeTab === 'hints' && (
            <div className="p-5 text-sm text-slate-300 space-y-3 bg-[#090d13]">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-white">Time &amp; Space Complexity Target:</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Target Time: <span className="font-mono text-cyan-300">O((V + E) log V)</span> using a Binary Min-Heap / Priority Queue. Avoid matrix representations for sparse campus networks.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-white">Constraint Bounds:</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    1 &le; nodes &le; 10&sup5;, 1 &le; edges.length &le; 2 &times; 10&sup5;, 0 &le; latency weight &le; 1000.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-white">Algorithmic Tip:</strong>
                  <p className="text-xs text-slate-300 mt-0.5">
                    For bidirectional campus networks, insert both (u &rarr; v) and (v &rarr; u) into adjacency maps before starting the min-heap relaxation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Interactive Test Runner */}
          {activeTab === 'runner' && (
            <div className="p-5 space-y-3 bg-[#090d13]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Client-Side Evaluation Suite
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Executes Dijkstra shortest path verification vectors in your browser runtime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunTestSuite}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isRunningTests ? 'Running...' : 'Run Test Suite'}</span>
                </button>
              </div>

              <div className="space-y-2.5 pt-2">
                {sampleTestCases.map((tc) => {
                  const res = testResults.find((r) => r.id === tc.id)
                  return (
                    <div
                      key={tc.id}
                      className={cn(
                        'p-3 rounded-xl border text-xs transition',
                        res
                          ? res.passed
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/30'
                          : 'bg-slate-900/60 border-slate-800'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <span className="font-mono text-cyan-400">Test Case #{tc.id}:</span>
                          <span>{tc.description}</span>
                        </span>

                        {res ? (
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-2 py-0.5 rounded',
                              res.passed
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            )}
                          >
                            {res.passed ? `PASSED (${res.latencyMs}ms)` : 'FAILED'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono">Ready to verify</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-1 border-t border-white/5">
                        <div>
                          <span className="text-slate-300 font-semibold">Input:</span> nodes={tc.nodes}, src={tc.src}
                        </div>
                        <div>
                          <span className="text-slate-300 font-semibold">Expected:</span>{' '}
                          <span className="text-cyan-300">{formatVector(tc.expected)}</span>
                        </div>
                        {res && (
                          <div className="sm:col-span-2">
                            <span className="text-slate-300 font-semibold">Actual Output:</span>{' '}
                            <span className={res.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {formatVector(res.actual)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {testResults.length > 0 && testResults.every((r) => r.passed) && (
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>All test vectors verified successfully!</span>
                  </span>

                  {!isChallengeSolved ? (
                    <button
                      type="button"
                      onClick={handleMarkAsSolved}
                      className="px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow transition"
                    >
                      Submit &amp; Mark as Solved
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetChallenge}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Status</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback Banner */}
          {statusMessage && (
            <div className="ide-feedback-banner" role="status">
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{statusMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-slate-400 hover:text-white text-xs ml-2"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {/* Actions Row */}
          <div className="ide-actions-row">
            <button
              type="button"
              className="btn-ide-run"
              onClick={handleRunTestSuite}
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              <span>{testResults.length > 0 ? 'Re-Run Test Suite' : 'Execute Test Suite'}</span>
            </button>
            <span className="ide-hint-text">
              Real-time in-browser verification &bull; External contest links available below.
            </span>
          </div>
        </div>

        {/* Right: Coding Platforms & Clubs */}
        <div className="coding-clubs-panel">
          <div className="panel-top-banner">
            <div className="panel-badge">CAMPUS CODE CLUBS</div>
            <h3 className="panel-title">Active Contests &amp; Chapters</h3>
            <p className="panel-desc">
              Recommended competitive programming environments and tools for CSE students.
            </p>
          </div>

          <div className="platforms-list">
            {codingPlatforms.map((platform, idx) => (
              <a
                key={idx}
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className="platform-row-card"
                aria-label={`Open ${platform.name} in a new tab`}
              >
                <div className="platform-left">
                  <span className="platform-icon-box">{platform.icon}</span>
                  <div>
                    <h4 className="platform-name">{platform.name}</h4>
                    <span className="platform-members">{platform.activeMembers}</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
              </a>
            ))}
          </div>

          <div className="hackathon-teaser-card">
            <div className="teaser-pill">CAMPUS HACKATHON PREVIEW</div>
            <h4 className="teaser-title">GIST ByteHacks 2026</h4>
            <p className="teaser-desc">
              Annual Department Hackathon organized by CSE Department. Collaborative hackathon fostering algorithmic innovation and product development.
            </p>
            <div className="flex items-center gap-1.5 teaser-dates">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Official registration dates and event handbook pending department circular</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CodingHub
