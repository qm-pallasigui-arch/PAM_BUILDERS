import { useWebsiteContent } from "../portal/content";
import { ContactInfoCard, phoneHref } from "../components/ContentCards";
import { useState } from "react";
import { Phone, Send } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export function Contact() {
  const { content } = useWebsiteContent();
  const contact = content.contact;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    projectType: "",
    message: "",
  });

  // Honeypot: invisible to real users, bots fill it automatically — used to block spam silently
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // client-side phone validation before submitting
    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    if (!phoneDigits) {
      setPhoneError("Phone number is required");
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setPhoneError("Enter a valid phone number (7–15 digits)");
      toast.error("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, honeypot }),
      });

      // Some endpoints return an empty body or plain text. Safely handle that.
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        // Not JSON — preserve raw text under `message`
        data = { message: text };
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || "Something went wrong.");
      }

      toast.success("Message sent successfully. Thank you for contacting us.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        projectType: "",
        message: "",
      });
      setHoneypot("");
    } catch (err: any) {
      toast.error(
        err.message || "Failed to send. Please try again or call us directly.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // allow only digits; strip all non-digit characters
    const raw = e.target.value || "";
    const digits = raw.replace(/\D/g, "");
    setFormData({ ...formData, phone: digits });

    // basic validation: require 7-15 digits
    if (!digits) {
      setPhoneError("Phone number is required");
    } else if (digits.length < 7 || digits.length > 15) {
      setPhoneError("Enter a valid phone number (7–15 digits)");
    } else {
      setPhoneError(null);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 to-orange-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl mb-6">{contact.title}</h1>
          <p className="text-xl text-orange-100 max-w-3xl mx-auto">
            {contact.intro}
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-2xl font-semibold mb-6">
                    {contact.formTitle}
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot field — hidden from humans, traps bots */}
                    <div
                      style={{
                        position: "absolute",
                        left: "-9999px",
                        opacity: 0,
                        pointerEvents: "none",
                      }}
                      aria-hidden="true"
                    >
                      <label htmlFor="website">Leave this blank</label>
                      <input
                        id="website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Juan dela Cruz"
                          className="mt-1"
                        />
                        {/* REPLACE: update placeholder to a locally familiar name if preferred */}
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="juan@example.com"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          inputMode="numeric"
                          pattern="\d*"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          required
                          placeholder="09123456789"
                          className="mt-1"
                        />
                        {phoneError && (
                          <p className="text-sm text-red-600 mt-1">
                            {phoneError}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="projectType">Project Type *</Label>
                        <select
                          id="projectType"
                          name="projectType"
                          value={formData.projectType}
                          onChange={handleChange}
                          required
                          className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-600"
                        >
                          <option value="">Select a project type</option>
                          {contact.projectTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="message">Project Details *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        placeholder="Tell us about your project, timeline, and any specific requirements..."
                        className="mt-1"
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-60"
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                      {!isSubmitting && <Send className="ml-2 h-5 w-5" />}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {contact.cards.map((card) => (
                <ContactInfoCard key={card.id} card={card} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      {contact.emergency.enabled && (
        <section className="bg-orange-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl mb-4">
              {contact.emergency.title}
            </h2>
            <p className="text-lg text-orange-100 mb-6">
              {contact.emergency.description}
            </p>
            {/* REPLACE: your actual phone number in the href below */}
            <a href={phoneHref(contact.emergency.phone)}>
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-orange-600 hover:bg-gray-100 border-white"
              >
                <Phone className="mr-2 h-5 w-5" />
                {contact.emergency.phone}
              </Button>
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
