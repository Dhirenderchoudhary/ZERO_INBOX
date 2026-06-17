import { HardDrive } from "lucide-react";

export default function DrivePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
        <HardDrive className="text-muted-foreground h-10 w-10" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold">
        Google Drive Integration Active
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Your Google Drive is connected via Corsair. The AI Agent can now search
        for your files natively and include their metadata in your automated
        email drafts.
      </p>
    </div>
  );
}
