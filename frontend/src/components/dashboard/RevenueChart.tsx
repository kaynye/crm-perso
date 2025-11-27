import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    data: { name: string; value: number }[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenus (6 derniers mois)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value.toLocaleString()} €`, 'Revenu']}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;
