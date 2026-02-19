import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/entities/auth";
import { ApiError } from "@/shared/api/api-error";
import { routePaths } from "@/shared/config/route-paths";
import { toErrorMessage } from "@/shared/lib/error-message";

type LoginFormResult = {
  username: string;
  password: string;
  error: string | null;
  loading: boolean;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
  submit: () => Promise<void>;
};

export function useLoginForm(): LoginFormResult {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate(routePaths.home, { replace: true });
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        return;
      }
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return {
    username,
    password,
    error,
    loading,
    setUsername,
    setPassword,
    submit
  };
}
