const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function readFile(p) { return fs.readFileSync(path.join(srcDir, p), 'utf8'); }
function writeFile(p, c) { fs.writeFileSync(path.join(srcDir, p), c, 'utf8'); }

const boardQueriesPath = 'hooks/use-board-queries.ts';
let boardQueries = readFile(boardQueriesPath);

// Board Decisions
const decisionsHooks = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/lib/api/services";
import { boardKeys, type BoardDecisionHistoryRow } from "@/hooks/use-board-queries";

export function useBoardDecisionHistoryQuery() {
  return useQuery<BoardDecisionHistoryRow[], Error>({
    queryKey: boardKeys.decisions(),
    queryFn: () => boardApi.decisionHistory() as Promise<BoardDecisionHistoryRow[]>,
    staleTime: 30000,
  });
}
`;

fs.mkdirSync(path.join(srcDir, 'features/board/decisions/api'), { recursive: true });
writeFile('features/board/decisions/api/decisions.queries.ts', decisionsHooks);

// Board Rankings
const rankingsHooks = `import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/lib/api/services";
import { rankingKeys, boardKeys, type RankingImportResult, type RankingImportInput } from "@/hooks/use-board-queries";

export function useImportRankingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<RankingImportResult, Error, RankingImportInput>({
    mutationFn: (body) => boardApi.importRankings(body) as Promise<RankingImportResult>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
      queryClient.invalidateQueries({ queryKey: boardKeys.decisions() });
    },
  });
}
`;

fs.mkdirSync(path.join(srcDir, 'features/board/rankings/api'), { recursive: true });
writeFile('features/board/rankings/api/rankings.mutations.ts', rankingsHooks);

// Remove and re-export
const decisionPattern = /export function useBoardDecisionHistoryQuery[\s\S]*?\}\);[\s]*\}/;
const rankingsPattern = /export function useImportRankingsMutation[\s\S]*?\}\);[\s]*\}/;

boardQueries = boardQueries.replace(decisionPattern, '');
boardQueries = boardQueries.replace(rankingsPattern, '');

boardQueries += `\nexport { useBoardDecisionHistoryQuery } from "@/features/board/decisions/api/decisions.queries";\n`;
boardQueries += `export { useImportRankingsMutation } from "@/features/board/rankings/api/rankings.mutations";\n`;

writeFile(boardQueriesPath, boardQueries);
console.log('Processed board hooks');
