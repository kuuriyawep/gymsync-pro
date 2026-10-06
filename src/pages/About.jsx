import React from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border h-16 flex items-center px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-lg">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Dumbbell className="w-4 h-4" />
          </div>
          GymSync Pro
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-10 md:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm hover:text-foreground mb-6 text-[#b0dcd7]">
          <ArrowLeft className="w-4 h-4" /> Back to app
        </Link>
        <h1 className="font-heading text-3xl md:text-4xl font-bold mb-6">About GymSync Pro</h1>
        <div className="prose prose-lg max-w-none space-y-4 text-muted-foreground">
          <p>
            GymSync Pro is an all-in-one gym management platform built for independent gym owners
            who want to stop juggling spreadsheets, paper records, and scattered tools. We
            provide a centralized dashboard where you can track members, record payments, monitor
            membership expirations, assign personal trainers, and view real-time analytics — all
            from a single, intuitive interface designed for busy fitness business owners.
          </p>
          <p>
            Our platform is designed for independent gym owners, fitness studio operators, and
            small-to-medium fitness businesses that need professional-grade management tools
            without the complexity or cost of enterprise software. Whether you run a boutique
            strength gym, a crossfit box, or a neighborhood fitness center, GymSync Pro adapts to
            your workflow and helps you stay on top of the operational details that matter most:
            who has paid, whose membership is expiring, and how your revenue is trending over time.
          </p>
          <p>
            GymSync Pro is built by a team passionate about fitness and technology. We believe
            that independent gym owners deserve access to the same powerful software tools that
            large chains use, without the steep learning curve or prohibitive pricing. Our
            mission is to simplify gym operations so owners can spend less time on paperwork and
            more time helping their members achieve their fitness goals. We continuously improve
            the platform based on real feedback from gym owners like you.
          </p>
        </div>
        <div className="mt-10 flex gap-3">
          <Link to="/register" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            Get started free
          </Link>
          <Link to="/contact" className="inline-flex items-center px-5 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-accent">
            Contact us
          </Link>
        </div>
      </main>
    </div>);

}