import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyData {
  month: string;
  count: number;
}

interface MonthlyChartProps {
  data: MonthlyData[];
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <motion.div
      className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white mb-8 tracking-apple-tight">
        Monthly Applications
      </h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="0" 
              stroke="rgba(0, 0, 0, 0.05)" 
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              stroke="rgba(0, 0, 0, 0.2)"
              tick={{ fill: 'rgba(0, 0, 0, 0.4)', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="rgba(0, 0, 0, 0.2)"
              tick={{ fill: 'rgba(0, 0, 0, 0.4)', fontSize: 11, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                color: '#1d1d1f',
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }}
            />
            <Bar 
              dataKey="count" 
              fill="#0071e3"
              radius={[4, 4, 4, 4]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
