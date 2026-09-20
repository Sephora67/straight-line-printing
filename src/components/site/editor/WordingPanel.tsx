import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSiteCopy } from "@/lib/site-copy";

export function WordingPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { entries, map, save } = useSiteCopy();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Wording on this page</SheetTitle>
        </SheetHeader>
        <p className="mt-2 text-sm text-muted-foreground">
          Change the words customers read. The layout stays exactly the same.
        </p>
        <div className="mt-6 space-y-5">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing to reword on this page — scroll through the page once and reopen this panel.
            </p>
          )}
          {entries.map((entry) => {
            const current = map[entry.id] ?? entry.fallback;
            return (
              <div key={entry.id} className="grid gap-2">
                <Textarea
                  key={current}
                  defaultValue={current}
                  rows={Math.min(4, Math.ceil(current.length / 48) || 1)}
                  onBlur={(e) => {
                    if (e.target.value !== current) void save(entry.id, e.target.value, entry.fallback);
                  }}
                />
                {current !== entry.fallback && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit text-xs"
                    onClick={() => void save(entry.id, entry.fallback, entry.fallback)}
                  >
                    Reset to original wording
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
