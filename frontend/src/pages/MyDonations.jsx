import React from "react";

function Dot() {
  return <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-3 mt-2" />;
}

function TimelineItem({ title, ago }) {
  return (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-start">
        <Dot />
        <p className="text-sm text-gray-800">{title}</p>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{ago}</span>
    </div>
  );
}

export default function MyDonations() {
  // ---- hardcoded placeholders ----
  const campaignX = "Campaign X";
  const campaignY = "Campaign Y";
  const campaignZ = "Campaign Z";
  const refundableAmount = 3; // ETH still refundable because campaignY not yet at Milestone 1

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Donations</h1>

      {/* Subtle refund callout only */}
      <section className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Refunds</h2>
        <p className="text-sm text-gray-600">
          You can request a refund before the first milestone is reached.
          Currently refundable: <span className="font-medium">{refundableAmount.toFixed(0)} ETH</span>
        </p>
        <div className="mt-4">
          <button
            type="button"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Request refund
          </button>
        </div>
      </section>

      {/* Event timeline */}
      <section className="rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Timeline</h2>

        <div className="relative">
          {/* vertical connector line */}
          <div className="absolute left-[5px] top-3 bottom-3 w-px bg-gray-200" />
          <div className="space-y-1">
            {/* newest → oldest (examples) */}
            <TimelineItem
              title={`5 ETH sent from your wallet to ${campaignZ}`}
              ago="0 mins ago"
            />
            <TimelineItem
              title={`3 ETH sent from your wallet to ${campaignY}`}
              ago="3 days ago"
            />
            <TimelineItem
              title={`4 ETH received by beneficiary (${campaignX})`}
              ago="9 days ago"
            />
            <TimelineItem
              title={`4 ETH received by platform (${campaignX})`}
              ago="11 days ago"
            />
            <TimelineItem
              title={`4 ETH sent from your wallet to ${campaignX}`}
              ago="11 days ago"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
