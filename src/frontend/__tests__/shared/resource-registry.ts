export interface ResourceRecord {
  kind: string;
  id: string;
  marker: string;
}

export class ResourceRegistry {
  private readonly resources: ResourceRecord[] = [];
  private readonly resourcesByKey = new Map<string, ResourceRecord>();

  register(resource: ResourceRecord): void {
    const key = this.key(resource.kind, resource.id);
    const existing = this.resourcesByKey.get(key);

    if (existing) {
      if (existing.marker !== resource.marker) {
        throw new Error(
          `${resource.kind} ${resource.id} is already registered with a different marker`
        );
      }

      return;
    }

    const record = { ...resource };
    this.resources.push(record);
    this.resourcesByKey.set(key, record);
  }

  get(kind: string, id: string): Readonly<ResourceRecord> | undefined {
    const resource = this.resourcesByKey.get(this.key(kind, id));
    return resource ? { ...resource } : undefined;
  }

  list(): readonly ResourceRecord[] {
    return this.resources.map((resource) => ({ ...resource }));
  }

  unregister(kind: string, id: string): boolean {
    const key = this.key(kind, id);
    const resource = this.resourcesByKey.get(key);
    if (!resource) return false;

    this.resourcesByKey.delete(key);
    const index = this.resources.indexOf(resource);
    if (index >= 0) this.resources.splice(index, 1);
    return true;
  }

  private key(kind: string, id: string): string {
    return JSON.stringify([kind, id]);
  }
}
