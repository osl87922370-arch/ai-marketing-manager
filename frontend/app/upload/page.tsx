"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { UploadCloud, Loader2 } from "lucide-react";
import { AnalysisResult } from "@/components/AnalysisResult";

export default function UploadPage() {
    const [text, setText] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = async () => {
        if (!text || !image) return;

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("text", text);
        formData.append("image", image);

        try {
            // In MVP, backend usually on localhost:8000
            const res = await fetch("http://localhost:8000/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) throw new Error("Analysis failed");

            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            alert("Failed to analyze. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">New Analysis</h1>
            <p className="text-slate-500 mb-8">Upload review content to extract multimodal insights.</p>

            {!result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Review Content</CardTitle>
                            <CardDescription>Enter the customer's text review.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                placeholder="e.g. The atmosphere was great but the coffee was too expensive..."
                                className="h-40 resize-none text-base"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Visual Context</CardTitle>
                            <CardDescription>Upload a photo attached to the review.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="w-full h-40 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden">
                                {preview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <UploadCloud className="text-slate-400 mb-2" size={32} />
                                        <span className="text-sm text-slate-400">Click to upload image</span>
                                    </>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {(text && image && !result && !loading) && (
                <div className="mt-8 flex justify-end">
                    <Button size="lg" onClick={handleAnalyze} className="bg-blue-600 hover:bg-blue-700">
                        Run CAMRec Analysis
                    </Button>
                </div>
            )}

            {loading && (
                <div className="mt-12 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
                    <p>Analyzing text semantics and visual patterns...</p>
                </div>
            )}

            {result && preview && (
                <div className="mt-8">
                    <AnalysisResult data={result} text={text} imagePreview={preview} />
                    <div className="mt-8 text-center">
                        <Button variant="outline" onClick={() => { setResult(null); setText(""); setImage(null); setPreview(null); }}>
                            Analyze Another
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
