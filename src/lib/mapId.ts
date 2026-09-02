export function mapId<T>(obj: T): T {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(mapId) as any;
  }

  // Handle Mongoose ObjectId (prevents recursing into its internal buffer)
  if (obj && typeof (obj as any).toHexString === 'function') {
    return (obj as any).toString();
  }
  
  if (typeof obj === 'object' && obj !== null && !(obj instanceof Date)) {
    const newObj: any = { ...obj };
    
    // Convert _id to id if it exists, and ensure _id becomes a string
    if (newObj._id) {
      newObj.id = newObj._id.toString();
      newObj._id = newObj._id.toString();
    }
    
    // Recursively map nested objects and arrays
    for (const key in newObj) {
      if (key !== '_id' && key !== 'id') {
        if (Array.isArray(newObj[key]) || (typeof newObj[key] === 'object' && newObj[key] !== null && !(newObj[key] instanceof Date))) {
          newObj[key] = mapId(newObj[key]);
        }
      }
    }
    
    return newObj;
  }
  
  return obj;
}

