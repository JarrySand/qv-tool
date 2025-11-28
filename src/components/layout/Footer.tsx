export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="text-muted-foreground container flex h-14 items-center justify-center text-sm">
        © {new Date().getFullYear()} QV-Tool. MIT License.
      </div>
    </footer>
  );
}
