import { plainToInstance, ClassConstructor, plainToClass, classToClassFromExist } from 'class-transformer';
import { log } from 'testcontainers';

/**
 * Maps a source object or class instance to a target DTO class instance.
 * Useful for transforming domain entities or request payloads into response DTOs.
 * @param dtoClass The target DTO class constructor.
 * @param sourceObject The source object or class instance to transform.
 * @param options Additional class-transformer options.
 * @returns An instance of the target DTO class.
 */
export function mapToDto<T>(
    dtoClass: ClassConstructor<T>,
    sourceObject: any, // Keep as any for a moment to allow logging different types
    options?: { excludeExtraneousValues?: boolean; groups?: string[] }
): T {
    // console.log('--- Inside mapToDto ---');
    // console.log('dtoClass name:', dtoClass.name);
    // console.log('sourceObject constructor name:', sourceObject?.constructor?.name);
    // console.log("------------------------------------------");
    // console.log(sourceObject);

    
    
    // console.log('sourceObject value:', JSON.stringify(sourceObject, null, 2)); // Be careful with circular refs
    // if (sourceObject && typeof sourceObject.getName === 'function' && sourceObject.getName()) {
    //     console.log('sourceObject.getName().getValue():', sourceObject.getName().getValue());
    // } else if (sourceObject && sourceObject.name && typeof sourceObject.name.getValue === 'function') {
    //      console.log('sourceObject.name.getValue():', sourceObject.name.getValue());
    // }


    try {
        return classToClassFromExist(dtoClass,sourceObject,{
            excludeExtraneousValues: true,
            ...options,
        });
    } catch (e) {
        console.error('Error inside plainToInstance within mapToDto:', e);
        throw e;
    }
}
// You could add other mapping helpers here, e.g., for arrays
export function mapToDtoArray<T>(
    dtoClass: ClassConstructor<T>,
    sourceArray: any[],
    options?: { excludeExtraneousValues?: boolean; groups?: string[] }
): T[] {
     return plainToInstance(dtoClass, sourceArray, {
        excludeExtraneousValues: true,
        ...options,
    });
}
export interface InspectInstanceOptions {
    /** Whether to display the values of own properties. Default: true */
    showPropertyValues?: boolean;
    /** Maximum length for stringified property values before truncation. Default: 100 */
    maxPropertyValueLength?: number;
    /** Whether to show members from Object.prototype. Default: false */
    includeObjectPrototypeMembers?: boolean;
    /** Custom function to format property values. Receives the value and property name. */
    formatPropertyValue?: (value: any, propertyName: string) => string;
  }
  
  export function inspectInstance(instance: any, options?: InspectInstanceOptions): void {
    const config: Required<InspectInstanceOptions> = {
      showPropertyValues: options?.showPropertyValues ?? true,
      maxPropertyValueLength: options?.maxPropertyValueLength ?? 100,
      includeObjectPrototypeMembers: options?.includeObjectPrototypeMembers ?? false,
      formatPropertyValue: options?.formatPropertyValue ?? ((val) => {
        if (typeof val === 'string') return `"${val}"`;
        if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
        if (val === null) return 'null';
        if (val === undefined) return 'undefined';
        if (typeof val === 'symbol') return val.toString();
        try {
          // Basic stringification, can be expanded (e.g., for Dates, custom classes)
          return JSON.stringify(val);
        } catch (e) {
          return '[Unserializable Object]';
        }
      }),
    };
  
    if (instance === null || instance === undefined) {
      console.log(`Cannot inspect: ${instance}`);
      return;
    }
  
    const constructorName = instance.constructor ? instance.constructor.name : '[Unknown Constructor]';
    console.log(`\n╔═══════════════════════════════════════╗`);
    console.log(`║ Inspecting Instance of: ${constructorName}`);
    console.log(`╚═══════════════════════════════════════╝`);
  
    if (typeof instance !== 'object' && typeof instance !== 'function') {
      console.log(`  Primitive Value: ${String(instance)} (Type: ${typeof instance})`);
      return;
    }
  
    // 1. Own Properties (Instance Variables)
    console.log("\n🔵 Own Properties (Instance Variables):");
    const ownPropertyNames = Object.getOwnPropertyNames(instance);
    if (ownPropertyNames.length === 0) {
      console.log("   <No own properties>");
    } else {
      ownPropertyNames.forEach(propName => {
        let propValueString = "";
        if (config.showPropertyValues) {
          try {
            const value = instance[propName];
            const type = typeof value;
            propValueString = `: ${config.formatPropertyValue(value, propName)}`;
            if (propValueString.length > config.maxPropertyValueLength + 2) { // +2 for ": "
              propValueString = propValueString.substring(0, config.maxPropertyValueLength + 2 - 3) + "...";
            }
            propValueString += ` (type: ${type})`;
          } catch (e: any) {
            propValueString = `: [Error accessing value: ${e.message || e}]`;
          }
        }
        console.log(`   - ${propName}${propValueString}`);
      });
    }
  
    // 2. Members from Prototype Chain (Methods, Getters, Setters)
    console.log("\n🟢 Members from Prototype Chain:");
    let currentPrototype = Object.getPrototypeOf(instance);
    const displayedMembers = new Set<string>(); // To avoid re-listing overridden members from deeper prototypes
    let foundAnyPrototypeMembers = false;
  
    while (currentPrototype && (config.includeObjectPrototypeMembers || currentPrototype !== Object.prototype)) {
      if (currentPrototype === Object.prototype && !config.includeObjectPrototypeMembers && ownPropertyNames.length > 0) {
          // If we are about to inspect Object.prototype and it's not explicitly requested,
          // and there were own properties, we can consider stopping or just noting it.
          // For now, the loop condition handles this.
      }
  
      const prototypeConstructorName = currentPrototype.constructor ? currentPrototype.constructor.name : '[Anonymous Prototype]';
      const descriptors = Object.getOwnPropertyDescriptors(currentPrototype);
      const membersOnThisPrototype: string[] = [];
  
      Object.entries(descriptors).forEach(([name, descriptor]) => {
        if (name === 'constructor' || displayedMembers.has(name)) {
          return;
        }
  
        let memberInfo = "";
        if (typeof descriptor.value === 'function') {
          memberInfo = `${name}() [Method]`;
        } else if (typeof descriptor.get === 'function' || typeof descriptor.set === 'function') {
          let accessorType = "";
          if (descriptor.get && descriptor.set) accessorType = "get/set";
          else if (descriptor.get) accessorType = "get";
          else if (descriptor.set) accessorType = "set";
          memberInfo = `${name} [Accessor:${accessorType}]`;
        }
  
        if (memberInfo) {
          membersOnThisPrototype.push(`     - ${memberInfo}`);
          displayedMembers.add(name);
          foundAnyPrototypeMembers = true;
        }
      });
  
      if (membersOnThisPrototype.length > 0) {
        console.log(`   --- Prototype: ${prototypeConstructorName} ---`);
        membersOnThisPrototype.forEach(info => console.log(info));
      }
  
      currentPrototype = Object.getPrototypeOf(currentPrototype);
      if (!currentPrototype && config.includeObjectPrototypeMembers) {
          // This means we've gone past Object.prototype, which has a null prototype.
          // No need to explicitly log "null prototype" unless for extreme debugging.
          break;
      }
    }
  
    if (!foundAnyPrototypeMembers) {
      console.log("   <No distinct members found on the prototype chain" +
                  (config.includeObjectPrototypeMembers ? "" : " (excluding Object.prototype)") +
                  ">");
    }
    console.log("----------------------------------------\n");
  }
  
  