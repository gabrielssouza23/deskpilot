"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { api } from "@/lib/api";
import type { TicketCreateInput } from "@/lib/types";

type Errors = Partial<Record<keyof TicketCreateInput, string>>;

const EMPTY: TicketCreateInput = {
  customer_name: "",
  customer_email: "",
  subject: "",
  message: "",
};

export function validateTicket(values: TicketCreateInput): Errors {
  const errors: Errors = {};
  if (!values.customer_name.trim()) errors.customer_name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customer_email.trim())) {
    errors.customer_email = "Enter a valid email address.";
  }
  if (values.subject.trim().length < 3) errors.subject = "Subject must be at least 3 characters.";
  if (values.message.trim().length < 10) {
    errors.message = "Describe the problem in at least 10 characters.";
  }
  return errors;
}

export function TicketForm() {
  const [values, setValues] = useState<TicketCreateInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const mutation = useMutation({ mutationFn: api.createTicket });

  function update(field: keyof TicketCreateInput, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTicket(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) mutation.mutate(values);
  }

  if (mutation.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-12 text-emerald-500" aria-hidden />
        <h3 className="text-lg font-semibold text-slate-900">
          Ticket #{mutation.data.id} received
        </h3>
        <p className="max-w-sm text-sm text-slate-600">
          Thanks, {values.customer_name.split(" ")[0]}! Our team will reply to{" "}
          <span className="font-medium">{values.customer_email}</span> soon.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setValues(EMPTY);
            mutation.reset();
          }}
        >
          Send another request
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="customer_name" error={errors.customer_name}>
          <Input
            id="customer_name"
            autoComplete="name"
            value={values.customer_name}
            onChange={(event) => update("customer_name", event.target.value)}
            aria-invalid={Boolean(errors.customer_name)}
          />
        </Field>
        <Field label="Email" htmlFor="customer_email" error={errors.customer_email}>
          <Input
            id="customer_email"
            type="email"
            autoComplete="email"
            value={values.customer_email}
            onChange={(event) => update("customer_email", event.target.value)}
            aria-invalid={Boolean(errors.customer_email)}
          />
        </Field>
      </div>
      <Field label="Subject" htmlFor="subject" error={errors.subject}>
        <Input
          id="subject"
          maxLength={200}
          value={values.subject}
          onChange={(event) => update("subject", event.target.value)}
          aria-invalid={Boolean(errors.subject)}
        />
      </Field>
      <Field label="How can we help?" htmlFor="message" error={errors.message}>
        <Textarea
          id="message"
          rows={5}
          maxLength={5000}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
        />
      </Field>
      {mutation.isError && <Alert>{mutation.error.message}</Alert>}
      <Button type="submit" loading={mutation.isPending} className="w-full">
        Submit request
      </Button>
    </form>
  );
}
