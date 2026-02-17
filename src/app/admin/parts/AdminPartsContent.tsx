"use client";

import { useState } from "react";
import { AddPartForm } from "./AddPartForm";
import { PartsList } from "./PartsList";

export function AdminPartsContent() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <>
      <AddPartForm onSuccess={() => setRefreshKey((k) => k + 1)} />
      <PartsList refreshKey={refreshKey} />
    </>
  );
}
