import { PublicLayout } from "../components/layout/PublicLayout";
import { EmptyState } from "../components/common/EmptyState";
export function NotFoundPage() { return <PublicLayout><EmptyState title="Seite nicht gefunden" text="Diese Adresse gibt es hier nicht." action={<a className="buttonLink" href="/">Zur Startseite</a>} /></PublicLayout>; }