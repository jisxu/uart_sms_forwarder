import {useEffect, useState} from 'react';
import {Globe, MessageSquare, Signal, TrendingUp} from 'lucide-react';
import {getStats} from '../api/messages';
import type {DeviceStatus, Stats} from '../api/types';
import {StatCard} from "@/components/StatsCard.tsx";
import {useQuery} from "@tanstack/react-query";
import {getStatus} from "@/api/serial.ts";

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
        const interval = setInterval(loadStats, 30000); // 每30秒刷新
        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const data = await getStats();
            setStats(data);
        } catch (error) {
            console.error('获取统计信息失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 获取设备状态 - 每 10 秒自动刷新
    const {data: deviceStatus} = useQuery<DeviceStatus>({
        queryKey: ['deviceStatus'],
        queryFn: async () => {
            const res = await getStatus();
            return res as DeviceStatus;
        },
        refetchInterval: 10000,
    });

    // 计算信号强度百分比（信号等级 0-31 转换为 0-100%）
    const getSignalPercentage = () => {
        if (!deviceStatus?.mobile?.signal_level) return 0;
        return Math.round((deviceStatus.mobile.signal_level / 31) * 100);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">统计面板</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="信号强度" value={getSignalPercentage()} unit="%" icon={Signal}
                          colorClass="bg-green-100 text-green-600" subValue={`CSQ: ${deviceStatus?.mobile?.signal_level}`}/>
                <StatCard label="当前运营商" value={deviceStatus?.mobile?.operator} icon={Globe}
                          colorClass="bg-blue-100 text-blue-600" subValue="4G LTE"/>
                <StatCard label={'总短信数'} value={stats?.totalCount || 0} icon={MessageSquare} unit={undefined}
                          subValue={undefined} colorClass="bg-green-100 text-green-600"/>
                <StatCard label={'今日短信'} value={stats?.todayCount || 0} icon={TrendingUp} unit={undefined}
                          subValue={undefined} colorClass="bg-purple-100 text-purple-600"/>
            </div>

            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
                <div className="space-y-2 text-sm text-gray-600">
                    <p>• 自动接收短信并发送通知到配置的渠道</p>
                    <p>• 支持定时发送短信</p>
                    <p>• 支持手动发送短信和串口控制</p>
                    <p>• 短信记录自动保存到数据库</p>
                </div>
            </div>
        </div>
    );
}
