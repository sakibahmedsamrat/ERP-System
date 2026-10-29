import prisma from '@/lib/prisma';
import { 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  Building2, 
  Calendar, 
  Phone, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Luggage,
  Sparkles
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/formatDate';

export const dynamic = 'force-dynamic';

export default async function GateVerificationPage({ 
  params,
  searchParams 
}: { 
  params: { id: string };
  searchParams?: { type?: string };
}) {
  const queryId = decodeURIComponent(params.id);

  // Check if it's a worker by ID or workerId
  let worker = await prisma.worker.findFirst({
    where: {
      OR: [
        { id: queryId },
        { workerId: queryId }
      ],
      isDeleted: false
    },
    include: {
      company: { select: { id: true, name: true, location: true } },
      department: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
    }
  });

  // Check if it's a visitor pass
  let visitor = null;
  if (!worker) {
    visitor = await prisma.visitorLog.findFirst({
      where: {
        OR: [
          { id: queryId },
          { passNumber: queryId },
          { passNumber: `VIS-${queryId}` }
        ]
      },
      include: {
        hostWorker: {
          select: {
            id: true,
            workerId: true,
            name: true,
            department: { select: { name: true } }
          }
        }
      }
    });
  }

  const now = new Date();
  const verificationTimestamp = now.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Overstay calculation for visitor
  let isOverstayed = false;
  let overstayMinutes = 0;
  if (visitor && visitor.status === 'IN_PREMISES') {
    const elapsedMinutes = Math.floor((now.getTime() - new Date(visitor.checkInTime).getTime()) / (1000 * 60));
    const duration = visitor.expectedDuration || 60;
    if (elapsedMinutes > duration) {
      isOverstayed = true;
      overstayMinutes = elapsedMinutes - duration;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Factory Gate Top Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Factory Gate Access Control</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white">Security Badge Verification</h1>
        </div>

        {/* WORKER VERIFIED */}
        {worker && (
          <div className="glass-card bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Verification Status Banner */}
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
              worker.isActive 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              {worker.isActive ? (
                <ShieldCheck size={28} className="text-emerald-400 shrink-0" />
              ) : (
                <ShieldAlert size={28} className="text-rose-400 shrink-0" />
              )}
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider">
                  {worker.isActive ? 'Valid & Verified Employee' : 'Access Restricted / Inactive'}
                </div>
                <div className="text-[11px] opacity-80">
                  {worker.isActive ? 'Clearance granted for factory premises' : 'Flagged in ERP — do not permit entry'}
                </div>
              </div>
            </div>

            {/* Employee Profile */}
            <div className="flex items-center gap-4">
              {worker.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={worker.photoUrl}
                  alt={worker.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-600/30 border border-blue-500/30 flex items-center justify-center font-bold text-2xl text-blue-300 shrink-0">
                  {worker.name?.charAt(0) || <User size={30} />}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white truncate">{worker.name}</h2>
                <div className="text-xs font-mono font-bold text-blue-400">ID: {worker.workerId}</div>
                <div className="text-xs text-slate-300 truncate mt-0.5">{worker.designation || 'Factory Staff'}</div>
              </div>
            </div>

            {/* Details Table */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Company / Unit:</span>
                <span className="font-bold text-white">{worker.company?.name || 'MEP Group'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Department:</span>
                <span className="font-semibold text-slate-200">{worker.department?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Section:</span>
                <span className="font-semibold text-slate-200">{worker.section?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-bold text-rose-400">{worker.bloodGroup || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Join Date:</span>
                <span className="font-semibold text-slate-200">{formatDate(worker.joinDate)}</span>
              </div>
              {worker.emergencyContactPhone && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-slate-400">Emergency Phone:</span>
                  <span className="font-bold text-amber-400 font-mono">{worker.emergencyContactPhone}</span>
                </div>
              )}
            </div>

            {/* Timestamp Security Seal */}
            <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
              Live Verified at: {verificationTimestamp}
            </div>
          </div>
        )}

        {/* VISITOR VERIFIED */}
        {visitor && (
          <div className="glass-card bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl p-6 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Overstay Warning Banner or Status */}
            {isOverstayed ? (
              <div className="p-3.5 rounded-2xl border bg-rose-500/20 border-rose-500/40 text-rose-300 flex items-center gap-3 animate-pulse">
                <AlertTriangle size={28} className="text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    Overstay Alert ({overstayMinutes} mins past limit)
                  </div>
                  <div className="text-[11px] opacity-90">
                    Visitor has exceeded the authorized stay duration.
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                visitor.status === 'IN_PREMISES'
                  ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                  : 'bg-slate-700/30 border-slate-600/30 text-slate-300'
              }`}>
                <CheckCircle2 size={28} className="text-indigo-400 shrink-0" />
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    {visitor.status === 'IN_PREMISES' ? 'Authorized Visitor In Premises' : 'Visitor Already Checked Out'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    Pass Number: {visitor.passNumber}
                  </div>
                </div>
              </div>
            )}

            {/* Visitor Details */}
            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Visitor Name</div>
              <h2 className="text-lg font-bold text-white">{visitor.visitorName}</h2>
              <div className="text-xs text-blue-400 font-mono">{visitor.visitorPhone}</div>
              {visitor.visitorCompany && (
                <div className="text-xs text-slate-300 font-medium">From: {visitor.visitorCompany}</div>
              )}
            </div>

            {/* Details Table */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Host Employee:</span>
                <span className="font-bold text-white">{visitor.hostWorker?.name || visitor.hostName || 'MEP Reception'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Purpose of Visit:</span>
                <span className="font-semibold text-slate-200">{visitor.purpose}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Belongings Logged:</span>
                <span className="font-semibold text-amber-300">{visitor.belongings || 'None recorded'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Check-in Time:</span>
                <span className="font-semibold text-slate-200">{formatDateTime(visitor.checkInTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Allowed Duration:</span>
                <span className="font-semibold text-slate-200">{visitor.expectedDuration || 60} Minutes</span>
              </div>
            </div>

            {/* Timestamp Security Seal */}
            <div className="pt-2 text-center text-[10px] text-slate-500 font-mono">
              Live Verified at: {verificationTimestamp}
            </div>
          </div>
        )}

        {/* NOT FOUND / TAMPERED BADGE */}
        {!worker && !visitor && (
          <div className="glass-card bg-rose-950/40 backdrop-blur-2xl rounded-3xl border border-rose-500/30 shadow-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <ShieldAlert size={36} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-300">Invalid or Unrecognized Badge</h2>
              <p className="text-xs text-rose-200/80 mt-1">
                The scanned QR badge code &quot;{queryId}&quot; is not registered or has been revoked in the ERP system.
              </p>
            </div>
            <div className="p-3 bg-rose-900/30 rounded-xl text-xs text-rose-300 font-semibold border border-rose-800/40">
              Security Action: Deny entrance and notify the HR / Security Office immediately.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
