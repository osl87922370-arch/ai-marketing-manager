import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Users, TrendingUp, Star } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Dashboard Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Reviews" value="1,284" icon={Activity} color="text-blue-500" />
                <StatsCard title="Avg. Sentiment" value="4.8/5.0" icon={Star} color="text-amber-500" />
                <StatsCard title="Engagement" value="+12.5%" icon={TrendingUp} color="text-emerald-500" />
                <StatsCard title="Active Users" value="842" icon={Users} color="text-purple-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-96 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
                <Card className="h-96 shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Top Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center h-full text-slate-400">
                            Pie Chart Placeholder
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="shadow-sm border-slate-200">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-slate-100 ${color}`}>
                    <Icon size={24} />
                </div>
            </CardContent>
        </Card>
    )
}
