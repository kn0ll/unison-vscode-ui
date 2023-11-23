import * as ReadonlyRecord from "fp-ts/ReadonlyRecord";
import * as ReadonlyArray from "fp-ts/ReadonlyArray";
import { flow } from "fp-ts/function";

export const mapDefinitionsByName = (name: string) => flow(
	ReadonlyRecord.toEntries,
	ReadonlyArray.map(([key, value]) => [key.slice(0, name.length), value] as const),
	ReadonlyRecord.fromEntries,
);

export const definitionSource = (definition?: { contents: { segment: string }[] }) => 
	definition ? definition.contents.map(({ segment }) => segment).join('') : null;
