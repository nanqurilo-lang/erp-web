"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Stage } from "@/types/stages";
import { Deal } from "@/types/deals";

export default function StagesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found. Please log in.");
          return;
        }

        // Fetch stages
        const stagesRes = await fetch("/api/deals/stages", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!stagesRes.ok) throw new Error("Failed to fetch stages");
        const stagesData: Stage[] = await stagesRes.json();

        // Fetch deals
        const dealsRes = await fetch("/api/deals/get", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!dealsRes.ok) throw new Error("Failed to fetch deals");
        const dealsData: Deal[] = await dealsRes.json();

        setStages(stagesData);
        setDeals(dealsData);
      } catch (err) {
        console.error(err);
        setError("Failed to load stages or deals. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold">
        Loading stages and deals...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-lg font-semibold text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Deals by Stage</h1>

      {stages.map((stage) => {
        const stageDeals = deals.filter((deal) => deal.dealStage === stage.name);
        return (
          <div key={stage.id} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{stage.name}</h2>
            {stageDeals.length === 0 ? (
              <p className="text-sm text-gray-600">No deals in this stage.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-4 border rounded-2xl shadow-sm hover:shadow-md transition bg-white"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {deal.dealAgentMeta?.profileUrl ? (
                        <Image
                          src={deal.dealAgentMeta.profileUrl}
                          alt={deal.dealAgentMeta.name}
                          width={50}
                          height={50}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-[50px] h-[50px] bg-gray-200 rounded-full" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <p className="text-sm text-gray-600">ID: {deal.id}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>
                        <span className="font-medium">Value:</span>{" "}
                        ${deal.value.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Category:</span>{" "}
                        {deal.dealCategory}
                      </p>
                      <p>
                        <span className="font-medium">Pipeline:</span>{" "}
                        {deal.pipeline}
                      </p>
                      <p>
                        <span className="font-medium">Agent:</span>{" "}
                        {deal.dealAgentMeta?.name || deal.dealAgent}
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(deal.createdAt).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/deals/get/${deal.id}`}
                        className="text-blue-600 underline"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-4">
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}