-- Replace the role placeholder only in the authenticated console. Never commit its password.
-- The role is created separately with a generated password stored in AWS Secrets Manager.
GRANT CONNECT ON DATABASE defaultdb TO "H1_RUNTIME_ROLE_PLACEHOLDER";
GRANT USAGE ON SCHEMA public TO "H1_RUNTIME_ROLE_PLACEHOLDER";
GRANT SELECT, INSERT, UPDATE ON TABLE public.h1_supervisor_memories TO "H1_RUNTIME_ROLE_PLACEHOLDER";
