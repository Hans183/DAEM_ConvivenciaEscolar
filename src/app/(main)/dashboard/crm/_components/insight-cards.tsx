"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


export function InsightCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-5">
      <Card className="col-span-1 xl:col-span-2">
        <CardHeader>
          <CardTitle>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent className="max-h-48">
        </CardContent>
        <CardFooter className="gap-2">
          <Button size="sm" variant="outline" className="basis-1/2">
            View Full Report
          </Button>
          <Button size="sm" variant="outline" className="basis-1/2">
            Download CSV
          </Button>
        </CardFooter>
      </Card>

      <Card className="col-span-1 xl:col-span-3">
        <CardHeader>
          <CardTitle>Project Revenue vs. Target</CardTitle>
        </CardHeader>
        <CardContent className="size-full max-h-52">
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground text-xs">Average progress: 78% · 2 projects above target</p>
        </CardFooter>
      </Card>
    </div>
  );
}
