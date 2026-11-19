import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { BanquetVenueDto } from '@/types/operations';
import { Card, StatCard, Badge } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageContainer, PageHeader, PageActions } from '@/components/layout';
import {
  Wine,
  Users,
  MapPin,
  Sparkles,
  RefreshCw,
  CalendarPlus,
  DollarSign,
  Volume2,
  Wifi,
  SunMedium,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const BanquetSpacesScreen: React.FC = () => {
  const [venues, setVenues] = useState<BanquetVenueDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchVenues = async () => {
    setLoading(true);
    const res = await api.get<BanquetVenueDto[]>('/banquet/venues');
    if (res.success && res.data) {
      setVenues(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter((v) =>
    searchQuery
      ? v.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.venueCode.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const totalCapacity = venues.reduce((acc, v) => acc + (v.maxCapacity || 0), 0);
  const avgHourlyRate = venues.length
    ? Math.round(venues.reduce((acc, v) => acc + v.hourlyRate, 0) / venues.length)
    : 0;

  return (
    <PageContainer>
      {/* Universal Compact Page Header */}
      <PageHeader
        breadcrumb={[
          { label: 'Banquets', href: '/banquet/events' },
          { label: 'Function Spaces' },
        ]}
        title="Function Spaces & Banquet Venues"
        subtitle="Grand ballrooms, executive boardrooms, and outdoor pavilions for corporate and private events"
        actions={
          <PageActions>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVenues}
              disabled={loading}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link to="/banquet/events">
              <Button
                size="sm"
                icon={<CalendarPlus className="w-3.5 h-3.5" />}
              >
                Book Event Contract
              </Button>
            </Link>
          </PageActions>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          title="Function Venues"
          value={venues.length}
          subtitle="Ballrooms &amp; conference halls"
          icon={<Building className="w-5 h-5" />}
          accentColor="amber"
        />
        <StatCard
          title="Total Max Capacity"
          value={`${totalCapacity.toLocaleString()} Pax`}
          subtitle="Simultaneous banquet capacity"
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />
        <StatCard
          title="Average Hourly Rate"
          value={`$${avgHourlyRate}`}
          subtitle="Base venue charge"
          icon={<DollarSign className="w-5 h-5" />}
          accentColor="emerald"
        />
        <StatCard
          title="Turnover Status"
          value="100% Operational"
          subtitle="A/V &amp; climate calibrated"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Search / Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Search venue name, location, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-4 py-2 text-xs rounded-xl border border-border dark:border-navy-700 bg-surface dark:bg-navy-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Showing <strong>{filteredVenues.length}</strong> of {venues.length} venues
        </span>
      </div>

      {/* Venues Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-sm font-medium">Loading luxury banquet spaces...</p>
        </div>
      ) : filteredVenues.length === 0 ? (
        <Card className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2 border-dashed">
          <Building className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Venues Found</h3>
          <p className="text-xs">No banquet venues match the search query.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVenues.map((venue) => (
            <Card
              key={venue.id}
              className="p-5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700/80 transition-all shadow-sm group"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60">
                    {venue.venueCode}
                  </span>
                  <Badge variant="success" size="sm">
                    {venue.status || 'AVAILABLE'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {venue.venueName}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{venue.location}</span>
                </div>

                {/* Capacity and Rate Pills */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-navy-800/60 rounded-xl mb-4 text-center border border-border dark:border-navy-700/60">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Max Pax</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center justify-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {venue.maxCapacity}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Hourly</div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      ${venue.hourlyRate.toFixed(0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Full Day</div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ${venue.dayRate.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Features amenities */}
                <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                    <Wifi className="w-3 h-3 text-indigo-500" /> Wi-Fi 6E
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                    <Volume2 className="w-3 h-3 text-purple-500" /> Pro A/V
                  </span>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300">
                    <SunMedium className="w-3 h-3 text-amber-500" /> Climate Control
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-border dark:border-navy-700/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Catering Ready
                </span>
                <Link to="/banquet/events">
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                    Reserve Venue &rarr;
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
};
