import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="ge-shell min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Page not found
            </h1>
          </div>

          <p className="mt-4 text-sm text-foreground">
            This address doesn't match a page in GlobalEdge. Use your
            browser’s Back button to return to the previous page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
