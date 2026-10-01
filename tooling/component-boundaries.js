import path from 'node:path';

const sourcePath = (filename) =>
  filename.replaceAll('\\', '/').match(/(?:^|\/)src\/(.+)$/)?.[1];
export function boundaryViolation(filename, specifier) {
  const source = sourcePath(filename);
  if (!source || !specifier.startsWith('.')) return null;
  const target = path.posix.normalize(
    path.posix.join(path.posix.dirname(source), specifier),
  );
  const layer = source.split('/')[0];
  const targetLayer = target.split('/')[0];
  if (layer === 'shared' && targetLayer !== 'shared')
    return 'Shared code may depend only on shared code and external packages.';
  if (layer === 'services' && !['services', 'shared'].includes(targetLayer))
    return 'Infrastructure must not depend on application composition or feature UI.';
  if (layer === 'features' && !['features', 'shared'].includes(targetLayer))
    return 'Features receive infrastructure operations through injected callbacks or clients.';
  if (targetLayer === 'features') {
    const sameFeature =
      layer === 'features' && source.split('/')[1] === target.split('/')[1];
    if (!sameFeature && !/^features\/[^/]+\/index(?:\.js)?$/.test(target))
      return 'Consume another feature through its index.js public interface.';
  }
  return null;
}

export const componentBoundaries = {
  meta: { type: 'problem', schema: [], messages: { boundary: '{{reason}}' } },
  create(context) {
    function check(node, source) {
      if (typeof source?.value !== 'string') return;
      const reason = boundaryViolation(context.filename, source.value);
      if (reason) context.report({ node, messageId: 'boundary', data: { reason } });
    }
    return {
      ImportDeclaration: (node) => check(node, node.source),
      ExportNamedDeclaration: (node) => check(node, node.source),
      ExportAllDeclaration: (node) => check(node, node.source),
      ImportExpression: (node) => check(node, node.source),
    };
  },
};
