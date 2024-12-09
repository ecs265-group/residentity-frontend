"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDots as Loader } from "@/components/loaders";
import axios from "axios";
import { generateKeypair, getToken } from "@/utils/user";

export default function Register() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    verifyPassword: "",
    firstName: "",
    lastName: "",
    organization: "",
    city: "",
    state: "",
    countryCode: "",
  });
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [buttonEnabled, setButtonEnabled] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.push("/");
    } else {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    // Enable button only if email and password are valid
    if (
      registerForm.email === "" ||
      registerForm.password === "" ||
      !validateEmail(registerForm.email) ||
      !validatePassword(registerForm.password) ||
      registerForm.password !== registerForm.verifyPassword ||
      registerForm.countryCode.length !== 2
    ) {
      setButtonEnabled(false);
    } else {
      setButtonEnabled(true);
    }
  }, [registerForm]);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const validatePassword = (password) => password.length >= 8;

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setRegisterForm((prevForm) => ({
      ...prevForm,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    const publicKey = (await generateKeypair(registerForm.password)).publicKey;

    try {
      const res = await axios.post(
        process.env.NEXT_PUBLIC_API_URL + "/api/register",
        {
          email: registerForm.email,
          password: registerForm.password,
          public_key: publicKey,
          first_name: registerForm.firstName,
          last_name: registerForm.lastName,
          city: registerForm.city,
          state: registerForm.state,
          country_code: registerForm.countryCode,
          organization: registerForm.organization,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.status === 200) {
        setSuccess("Registration successful! Redirecting to login page...");
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(res.data.error?.message || "An error occurred. Please try again later.");
      }
    } catch (error) {
      setError(
        error.response?.data?.error?.message || "An error occurred. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className='flex justify-center mt-2'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='pt-6'>
      <div className='mx-auto w-1/3 flex flex-col items-center justify-center text-center border bg-c0 gap-1 rounded-lg border-white/15 p-6'>
        <h1 className='text-3xl text-white font-semibold p-4'>Register</h1>
        <form className='w-2/3 flex flex-col gap-2'>
          {[
            { id: "email", type: "email", placeholder: "Email" },
            { id: "password", type: "password", placeholder: "Password" },
            {
              id: "verifyPassword",
              type: "password",
              placeholder: "Re-enter Password",
            },
            { id: "firstName", type: "text", placeholder: "First Name" },
            { id: "lastName", type: "text", placeholder: "Last Name" },
            { id: "organization", type: "text", placeholder: "Organization" },
            { id: "city", type: "text", placeholder: "City" },
            { id: "state", type: "text", placeholder: "State" },
            { id: "countryCode", type: "text", placeholder: "Country Code" },
          ].map((field) => (
            <div className='flex flex-col' key={field.id}>
              <label htmlFor={field.id} className='flex text-c2 text-sm font-medium'>
                {field.placeholder}
              </label>
              <input
                type={field.type}
                id={field.id}
                className='p-2 rounded-md text-white bg-c0 border border-white/15 placeholder-c2/50 text-sm focus:outline-none'
                placeholder={field.placeholder}
                value={registerForm[field.id]}
                onChange={handleInputChange}
                onKeyUp={(e) => (e.key === "Enter" ? handleSubmit(e) : null)}
              />
            </div>
          ))}
          <button
            disabled={!buttonEnabled}
            className={`h-9 px-4 py-2 my-1 w-full flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors
            focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white border
            bg-c1 text-white border-c2 cursor-pointer
            hover:bg-white hover:text-c0
            disabled:bg-c1 disabled:text-c2 disabled:cursor-not-allowed`}
            onClick={(e) => handleSubmit(e)}
          >
            Register
          </button>
        </form>
        {loading && (
          <div className='flex justify-center mt-2'>
            <Loader />
          </div>
        )}
        {success && <div className='text-green-500/90 text-sm text-center'>{success}</div>}
        {error && <div className='text-red-500/90 text-sm text-center'>{error}</div>}
      </div>
    </div>
  );
}
