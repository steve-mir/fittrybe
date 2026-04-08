import Link from "next/link";
import type { FittrybeEvent } from "@/lib/events";
import { sportEmoji, formatEventDate, formatEventTime, formatPrice } from "@/lib/events";

interface EventCardProps {
  event: FittrybeEvent;
}

export default function EventCard({ event }: EventCardProps) {
  const emoji = sportEmoji(event.sportId);
  const dateStr = formatEventDate(event.startsAt);
  const timeStr = formatEventTime(event.startsAt);
  const price = formatPrice(event.joinPricePence);
  const coverImage = event.bannerUrl || event.placePhotoUrl;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#B6FF00]/40 transition-all duration-300 hover:-translate-y-1"
    >
      {/* Cover image */}
      {coverImage ? (
        <div className="aspect-[16/9] overflow-hidden bg-white/5 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Sport badge */}
          <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[#B6FF00] border border-[#B6FF00]/30">
            {emoji} {event.sportId}
          </span>
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-[#B6FF00]/10 to-white/5 flex items-center justify-center relative">
          <span className="text-5xl">{emoji}</span>
          <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/60 text-[#B6FF00] border border-[#B6FF00]/30">
            {event.sportId}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h2 className="text-lg font-bold text-white mb-2 group-hover:text-[#B6FF00] transition-colors line-clamp-2 font-[family-name:var(--font-barlow-condensed)]">
          {event.title}
        </h2>

        {/* Location */}
        <p className="text-sm text-white/50 mb-4 font-[family-name:var(--font-dm-sans)] flex items-center gap-1.5 line-clamp-1">
          <svg className="w-3.5 h-3.5 text-[#B6FF00]/70 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          {event.locationLabel || event.placeName || event.locationArea}
        </p>

        {/* Meta row */}
        <div className="flex items-center justify-between text-xs font-[family-name:var(--font-dm-sans)]">
          <div className="flex flex-col gap-0.5">
            <span className="text-white/70 font-medium">{dateStr}</span>
            <span className="text-white/40">{timeStr}</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Spots */}
            <span className={`font-semibold ${event.spotsLeft <= 3 ? "text-orange-400" : "text-white/50"}`}>
              {event.spotsLeft > 0 ? `${event.spotsLeft} spot${event.spotsLeft === 1 ? "" : "s"}` : "Full"}
            </span>
            {/* Price */}
            <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
              event.joinPricePence === 0
                ? "bg-[#B6FF00]/10 text-[#B6FF00]"
                : "bg-white/10 text-white"
            }`}>
              {price}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}