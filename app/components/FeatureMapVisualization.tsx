import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  MiniMap,
  type Node,
  type Edge,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Badge } from '~/components/ui/badge';

type Feature = {
  featureName: string;       // now acts as unique identifier
  userSummary: string;
  aiSummary: string;
  filenames: string[];
  neighbors: string[];       // references to other featureNames
};

export default function FeatureMapVisualization({ features }: { features: Feature[] }) {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!features || features.length === 0) return;

    // Layout nodes in a circle
    const centerX = 400;
    const centerY = 300;
    const radius = 180;
    const angleStep = (2 * Math.PI) / features.length;

    const newNodes: Node[] = features.map((feature, idx) => {
      const angle = idx * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      return {
        id: feature.featureName, // use featureName as id
        type: 'default',
        data: {
          label: (
            <div className="px-4 py-3 text-center">
              <div className="font-bold text-sm text-white mb-1">{feature.featureName}</div>
              <div className="text-xs text-purple-300 font-medium">
                {feature.filenames?.length || 0} files
              </div>
            </div>
          ),
        },
        position: { x, y },
        style: {
          background: 'linear-gradient(135deg, rgba(126, 58, 242, 0.4) 0%, rgba(168, 85, 247, 0.3) 100%)',
          border: '2px solid rgba(168, 85, 247, 0.8)',
          borderRadius: '12px',
          fontSize: '12px',
          color: '#ffffff',
          width: 180,
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.4), 0 0 80px rgba(168, 85, 247, 0.2)',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
        },
      };
    });

    // Create edges based on neighbor featureNames
    const newEdges: Edge[] = features.flatMap((feature) =>
      (feature.neighbors || []).map((neighborName) => ({
        id: `${feature.featureName}-${neighborName}`,
        source: feature.featureName,
        target: neighborName,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'rgba(168, 85, 247, 0.6)',
          strokeWidth: 3,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: 'rgba(168, 85, 247, 0.6)',
        },
      }))
    );

    setNodes(newNodes);
    setEdges(newEdges);
  }, [features, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const feature = features.find((f) => f.featureName === node.id);
      if (feature) setSelectedFeature(feature);
    },
    [features]
  );

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!features || features.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Feature Map</CardTitle>
          <CardDescription className="text-gray-400">
            No features found. Connect a repository to generate the feature map.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[600px] bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Feature Map</CardTitle>
          <CardDescription className="text-gray-400">
            Visual representation of your repository's features. Click on a feature to see details.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-full pb-4">
          <div
            className="h-[450px] rounded-lg overflow-hidden reactflow-dark"
            style={{ background: "#1e293b" }}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
              attributionPosition="bottom-left"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={16}
                size={1}
                color="#475569"
              />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </CardContent>
      </Card>

      {/* Feature Details Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedFeature?.featureName}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Feature details and associated files
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-400">What it does (Non-technical)</h4>
              <p className="text-sm text-gray-300">{selectedFeature?.userSummary}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-400">How it works (Technical)</h4>
              <p className="text-sm text-gray-300">{selectedFeature?.aiSummary}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-2 text-purple-400">Associated Files</h4>
              <div className="flex flex-wrap gap-2">
                {selectedFeature?.filenames?.map((file, idx) => (
                  <Badge key={idx} variant="secondary" className="font-mono text-xs bg-gray-800 text-purple-300 border-purple-700">
                    {file}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedFeature?.neighbors && selectedFeature.neighbors.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-purple-400">Connected Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.neighbors.map((neighborName) => {
                    const neighbor = features.find((f) => f.featureName === neighborName);
                    return neighbor ? (
                      <Badge key={neighborName} variant="outline" className="border-purple-600 text-purple-300">
                        {neighbor.featureName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}