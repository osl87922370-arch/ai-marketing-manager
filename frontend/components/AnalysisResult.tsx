"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AnalysisResultProps {
    data: {
        score: number;
        attention_image: number[][]; // 7x7 grid
        attention_text: number[]; // Array of weights
        report: string;
    };
    text: string;
    imagePreview: string; // URL
}

export function AnalysisResult({ data, text, imagePreview }: AnalysisResultProps) {
    // Normalize text attention for opacity
    const maxAtt = Math.max(...data.attention_text, 0.0001);
    const words = text.split(" "); // Simple split for MVP visualization (assuming backend tokenized similarly or we map loosely)

    // Note: Backend roberta tokenization differs from simple space split. 
    // For MVP, we will just map the first N weights to N words or average.
    // We'll trust the length matches roughly or truncate.

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Analysis Results</h2>
                <Badge variant={data.score > 0.7 ? "default" : "secondary"} className="text-lg px-4 py-1">
                    Score: {(data.score * 10).toFixed(1)}/10
                </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Visual Attention */}
                <Card>
                    <CardHeader><CardTitle>Visual Attention</CardTitle></CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="relative w-64 h-64 rounded-lg overflow-hidden shadow-lg group">
                            {/* Original Image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="Analyzed" className="absolute inset-0 w-full h-full object-cover" />

                            {/* Heatmap Overlay */}
                            <div className="absolute inset-0 grid grid-cols-7 grid-rows-7 opacity-50 group-hover:opacity-75 transition-opacity">
                                {data.attention_image.flat().map((val, idx) => (
                                    <div
                                        key={idx}
                                        style={{ backgroundColor: `rgba(255, 0, 0, ${val * 5})` }} // Boost visibility
                                        className="w-full h-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Text Attention */}
                <Card>
                    <CardHeader><CardTitle>Textual Focus</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-lg leading-relaxed p-4 bg-slate-50 rounded-lg border border-slate-100">
                            {words.map((word, idx) => {
                                const weight = data.attention_text[idx] || 0;
                                const opacity = (weight / maxAtt) * 0.8;
                                return (
                                    <span
                                        key={idx}
                                        className="inline-block mr-1 px-1 rounded transition-colors hover:bg-yellow-200"
                                        style={{ backgroundColor: `rgba(59, 130, 246, ${opacity})` }}
                                    >
                                        {word}
                                    </span>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report */}
            <Card className="bg-slate-900 text-slate-100 border-none">
                <CardHeader><CardTitle className="text-emerald-400">Generated Insights</CardTitle></CardHeader>
                <CardContent>
                    <div className="prose prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap font-sans text-sm">{data.report}</pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
