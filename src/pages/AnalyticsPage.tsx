import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { useApp } from '../contexts/AppContext'
import { supabase } from '../lib/supabase'
import { FileText, Clock, Target, TrendingUp } from 'lucide-react'
import { format, subDays, startOfDay } from 'date-fns'

interface AnalyticsData {
  totalExtractions: number
  totalFilesProcessed: number
  totalTextExtracted: number
  averageConfidence: number
  dailyExtractions: Array<{ date: string; extractions: number }>
  fileTypeDistribution: Array<{ type: string; count: number; color: string }>
  confidenceDistribution: Array<{ range: string; count: number }>
}

export function AnalyticsPage() {
  const { user } = useAuth()
  const { isDarkMode } = useApp()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    if (!user) return

    try {
      // Fetch user analytics
      const { data: userAnalytics } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Fetch extractions for detailed analytics
      const { data: extractions } = await supabase
        .from('extractions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (extractions) {
        // Calculate daily extractions for the last 7 days
        const dailyExtractions = []
        for (let i = 6; i >= 0; i--) {
          const date = startOfDay(subDays(new Date(), i))
          const dayExtractions = extractions.filter(
            extraction => startOfDay(new Date(extraction.created_at)).getTime() === date.getTime()
          ).length
          
          dailyExtractions.push({
            date: format(date, 'MMM dd'),
            extractions: dayExtractions
          })
        }

        // Calculate file type distribution
        const fileTypes: { [key: string]: number } = {}
        extractions.forEach(extraction => {
          const type = extraction.file_type.split('/')[0]
          fileTypes[type] = (fileTypes[type] || 0) + 1
        })

        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
        const fileTypeDistribution = Object.entries(fileTypes).map(([type, count], index) => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count,
          color: colors[index % colors.length]
        }))

        // Calculate confidence distribution
        const confidenceRanges = {
          'High (80-100%)': 0,
          'Medium (60-79%)': 0,
          'Low (0-59%)': 0
        }

        extractions.forEach(extraction => {
          const confidence = extraction.confidence_score * 100
          if (confidence >= 80) confidenceRanges['High (80-100%)']++
          else if (confidence >= 60) confidenceRanges['Medium (60-79%)']++
          else confidenceRanges['Low (0-59%)']++
        })

        const confidenceDistribution = Object.entries(confidenceRanges).map(([range, count]) => ({
          range,
          count
        }))

        setAnalytics({
          totalExtractions: userAnalytics?.total_extractions || 0,
          totalFilesProcessed: userAnalytics?.total_files_processed || 0,
          totalTextExtracted: userAnalytics?.total_text_extracted || 0,
          averageConfidence: userAnalytics?.average_confidence || 0,
          dailyExtractions,
          fileTypeDistribution,
          confidenceDistribution
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-300 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium mb-2">No analytics data available</h3>
          <p>Start extracting text from documents to see your analytics</p>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total Extractions',
      value: analytics.totalExtractions.toLocaleString(),
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Files Processed',
      value: analytics.totalFilesProcessed.toLocaleString(),
      icon: Clock,
      color: 'green'
    },
    {
      title: 'Characters Extracted',
      value: analytics.totalTextExtracted.toLocaleString(),
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Avg. Confidence',
      value: `${Math.round(analytics.averageConfidence * 100)}%`,
      icon: Target,
      color: 'orange'
    }
  ]

  const getStatCardColor = (color: string) => {
    const colors = {
      blue: isDarkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-600',
      green: isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-600',
      purple: isDarkMode ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-50 text-purple-600',
      orange: isDarkMode ? 'bg-orange-900/20 text-orange-300' : 'bg-orange-50 text-orange-600'
    }
    return colors[color as keyof typeof colors]
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Analytics Dashboard
        </h1>
        <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Track your text extraction performance and usage statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${getStatCardColor(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stat.title}
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Extractions */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Daily Extractions (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analytics.dailyExtractions}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="date" 
                stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                fontSize={12}
              />
              <YAxis 
                stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#F9FAFB' : '#111827'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="extractions" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* File Type Distribution */}
        <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            File Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analytics.fileTypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.fileTypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px',
                  color: isDarkMode ? '#F9FAFB' : '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className={`rounded-xl shadow-sm p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Confidence Score Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.confidenceDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
            <XAxis 
              dataKey="range" 
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={12}
            />
            <YAxis 
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`,
                borderRadius: '8px',
                color: isDarkMode ? '#F9FAFB' : '#111827'
              }}
            />
            <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}