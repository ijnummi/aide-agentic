import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import '../../styles/allotment.css';
import type { LayoutTree } from '../../../shared/types/layout';
import { PaneContainer } from './PaneContainer';
import { useLayoutStore } from '../../stores/layout.store';

interface SplitContainerProps {
  node: LayoutTree;
  cwd: string;
}

export function SplitContainer({ node, cwd }: SplitContainerProps) {
  const updateSplitSizes = useLayoutStore((s) => s.updateSplitSizes);

  if (node.type === 'pane') {
    return <PaneContainer pane={node} cwd={cwd} />;
  }

  return (
    <Allotment
      vertical={node.direction === 'vertical'}
      defaultSizes={node.sizes}
      onDragEnd={(sizes) => {
        if (sizes) {
          updateSplitSizes(node.id, sizes as number[]);
        }
      }}
    >
      {node.children.map((child) => (
        <Allotment.Pane key={child.id} minSize={100}>
          <SplitContainer node={child} cwd={cwd} />
        </Allotment.Pane>
      ))}
    </Allotment>
  );
}
