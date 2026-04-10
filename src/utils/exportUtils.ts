import { Parser, ModelExporter } from '@dbml/core';

export function exportSql(dbmlCode: string, dialect: 'postgres' | 'mysql' | 'mssql'): string {
  const database = Parser.parse(dbmlCode, 'dbmlv2');
  const dialectMap = {
    postgres: 'postgres',
    mysql: 'mysql',
    mssql: 'mssql',
  };

  return ModelExporter.export(database, dialectMap[dialect] as 'postgres' | 'mysql' | 'mssql', false);
}
