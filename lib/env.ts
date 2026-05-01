function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value;
}

export const env = {
  DATABASE_URL: getRequiredEnvVar("DATABASE_URL"),
  REDIS_URL: getRequiredEnvVar("REDIS_URL"),
  OPENAI_API_KEY: getRequiredEnvVar("OPENAI_API_KEY"),
  NEXT_PUBLIC_APP_URL: getRequiredEnvVar("NEXT_PUBLIC_APP_URL"),
};
