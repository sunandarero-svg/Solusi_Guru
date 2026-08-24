export function mapId<T>(obj: T): T {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(mapId) as any;
  }
  
  if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
    const newObj: any = { ...obj };
    
    // Convert _id to id if it exists
    if (newObj._id) {
      newObj.id = newObj._id.toString();
    }
    
    // Recursively map nested objects and arrays
    for (const key in newObj) {
      // Don't recurse into React nodes or huge objects, but our API responses are simple
      if (Array.isArray(newObj[key]) || (typeof newObj[key] === 'object' && newObj[key] !== null && !(newObj[key] instanceof Date))) {
        newObj[key] = mapId(newObj[key]);
      }
    }
    
    return newObj;
  }
  
  return obj;
}
