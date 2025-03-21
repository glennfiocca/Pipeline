import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Profile, insertProfileSchema, type InsertProfile } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, Globe, Code } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { User } from "lucide-react";

// Add file state management
interface FileState {
  resume?: File;
  transcript?: File;
}

// Update the fetchOrCreateProfile function with better error handling
const fetchOrCreateProfile = async (userId: number) => {
  try {
    console.log("Fetching profile for user:", userId);
    const response = await apiRequest("GET", `/api/profiles/${userId}`);

    if (!response.ok) {
      // If profile doesn't exist, return a default profile instead of throwing
      console.log("Profile not found, creating default");
      return {
        name: "",
        email: "",
        phone: "",
        title: "",
        bio: "",
        location: "",
        education: [],
        experience: [],
        skills: [],
        certifications: [],
        languages: [],
        publications: [],
        projects: [],
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        workAuthorization: "US Citizen",
        availability: "2 Weeks",
        citizenshipStatus: "",
        userId: userId,
        resumeUrl: "",
        transcriptUrl: ""
      };
    }

    const profile = await response.json();
    console.log("Fetched profile:", profile);
    return profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
    // Return default profile instead of throwing
    return {
      name: "",
      email: "",
      phone: "",
      title: "",
      bio: "",
      location: "",
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      languages: [],
      publications: [],
      projects: [],
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      workAuthorization: "US Citizen",
      availability: "2 Weeks",
      citizenshipStatus: "",
      userId: userId,
      resumeUrl: "",
      transcriptUrl: ""
    };
  }
};

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [debugMsg, setDebugMsg] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [fileState, setFileState] = useState<FileState>({});
  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      title: "",
      bio: "",
      location: "",
      education: [],
      experience: [],
      skills: [],
      certifications: [],
      languages: [],
      publications: [],
      projects: [],
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      workAuthorization: "US Citizen",
      availability: "2 Weeks",
      citizenshipStatus: "US Citizen",
      resumeUrl: "",
      transcriptUrl: ""
    }
  });

  // Update the useQuery implementation for profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("No user ID");
      return fetchOrCreateProfile(user.id);
    },
    enabled: !!user?.id,
    staleTime: Infinity, // Keep the data forever until explicitly invalidated
    gcTime: Infinity, // Never remove this data from the cache (replaces cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    refetchOnMount: false, // Don't refetch when component mounts
  });

  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      console.log("Setting form values from profile:", profile);
      
      // We need to safely handle each field type to prevent errors
      form.setValue("name", profile.name || "", { shouldDirty: false });
      form.setValue("email", profile.email || "", { shouldDirty: false });
      form.setValue("phone", profile.phone || "", { shouldDirty: false });
      form.setValue("title", profile.title || "", { shouldDirty: false });
      form.setValue("bio", profile.bio || "", { shouldDirty: false });
      form.setValue("location", profile.location || "", { shouldDirty: false });
      
      // Address fields
      form.setValue("address", profile.address || "", { shouldDirty: false });
      form.setValue("city", profile.city || "", { shouldDirty: false });
      form.setValue("state", profile.state || "", { shouldDirty: false });
      form.setValue("zipCode", profile.zipCode || "", { shouldDirty: false });
      form.setValue("country", profile.country || "", { shouldDirty: false });
      
      // Work fields
      form.setValue("workAuthorization", profile.workAuthorization || "", { shouldDirty: false });
      form.setValue("availability", profile.availability || "", { shouldDirty: false });
      form.setValue("citizenshipStatus", profile.citizenshipStatus || "", { shouldDirty: false });
      form.setValue("visaSponsorship", profile.visaSponsorship || false, { shouldDirty: false });
      form.setValue("willingToRelocate", profile.willingToRelocate || false, { shouldDirty: false });
      form.setValue("salaryExpectation", profile.salaryExpectation || "", { shouldDirty: false });
      
      // Array fields
      if (Array.isArray(profile.education)) form.setValue("education", profile.education, { shouldDirty: false });
      if (Array.isArray(profile.experience)) form.setValue("experience", profile.experience, { shouldDirty: false });
      if (Array.isArray(profile.skills)) form.setValue("skills", profile.skills, { shouldDirty: false });
      if (Array.isArray(profile.certifications)) form.setValue("certifications", profile.certifications, { shouldDirty: false });
      if (Array.isArray(profile.languages)) form.setValue("languages", profile.languages, { shouldDirty: false });
      if (Array.isArray(profile.publications)) form.setValue("publications", profile.publications, { shouldDirty: false });
      if (Array.isArray(profile.projects)) form.setValue("projects", profile.projects, { shouldDirty: false });
      if (Array.isArray(profile.preferredLocations)) form.setValue("preferredLocations", profile.preferredLocations, { shouldDirty: false });
      
      // URL fields
      form.setValue("resumeUrl", profile.resumeUrl || "", { shouldDirty: false });
      form.setValue("transcriptUrl", profile.transcriptUrl || "", { shouldDirty: false });
      form.setValue("linkedinUrl", profile.linkedinUrl || "", { shouldDirty: false });
      form.setValue("portfolioUrl", profile.portfolioUrl || "", { shouldDirty: false });
      form.setValue("githubUrl", profile.githubUrl || "", { shouldDirty: false });
      
      // Reset form's dirty state
      if (formRef.current) {
        formRef.current.dataset.isDirty = 'false';
      }
    }
  }, [profile]);

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray({
      control: form.control,
      name: "education"
    });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({
      control: form.control,
      name: "experience"
    });

  // Add field arrays for new sections
  const { fields: certificationFields, append: appendCertification, remove: removeCertification } =
    useFieldArray({
      control: form.control,
      name: "certifications"
    });

  const { fields: projectFields, append: appendProject, remove: removeProject } =
    useFieldArray({
      control: form.control,
      name: "projects"
    });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } =
    useFieldArray({
      control: form.control,
      name: "languages"
    });

  // Handle adding skills
  const handleAddSkill = useCallback(() => {
    if (skillInput.trim()) {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillInput.trim())) {
        form.setValue("skills", [...currentSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  }, [skillInput, form]);

  // Handle removing skills
  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(s => typeof s === 'string' && s !== skillToRemove));
  }, [form]);

  // Handle adding language
  const handleAddLanguage = useCallback(() => {
    if (languageInput.trim()) {
      appendLanguage({
        name: languageInput.trim(),
        proficiency: "Intermediate"
      });
      setLanguageInput("");
    }
  }, [languageInput, appendLanguage]);

  // Add this effect to track form dirty state
  useEffect(() => {
    // Update form dirty state for navigation warning
    if (formRef.current) {
      formRef.current.dataset.isDirty = form.formState.isDirty ? 'true' : 'false';
    }
  }, [form.formState.isDirty]);

  // Completely rewrite the onSubmit function to properly persist form data
  const onSubmit = async (data: InsertProfile) => {
    try {
      // Store the current form values
      const currentValues = form.getValues();
      console.log("Submitting form values:", currentValues);
      
      // Ensure we're adding user ID to the profile data
      const profileData = {
        ...currentValues,
        userId: user?.id
      };
      
      console.log("Sending profile data to server", profileData);
      
      // Submit to server 
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.message || 'Failed to save profile');
      }
      
      // Process the response
      const savedProfile = await response.json();
      console.log("Server returned saved profile:", savedProfile);
      
      // Update the React Query cache with the saved data
      queryClient.setQueryData(["profile", user?.id], savedProfile);
      
      // Reset form state to mark as pristine
      form.reset(savedProfile);
      
      // Mark form as pristine
      if (formRef.current) {
        formRef.current.dataset.isDirty = 'false';
      }
      
      toast({
        title: "Success",
        description: "Your profile has been saved successfully.",
      });
      
      return savedProfile;
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDirectSave = () => {
    console.log("Direct save button clicked");

    // Get current form values
    const formData = form.getValues();

    // Log validation errors but proceed anyway
    if (Object.keys(form.formState.errors).length > 0) {
      console.warn("Form has validation errors:", form.formState.errors);
    }

    // Bypass the form validation and submit directly
    onSubmit(formData).then(() => {
      // Fix the null check on user
      if (user?.id) {
        // Force a refetch of the profile data to ensure UI is in sync
        queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      }
    });
  };


  const cleanObject = (obj: any) => {
    const cleaned: any = {};

    // Copy all defined properties
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        // Handle specific field types
        if (typeof obj[key] === 'string') {
          cleaned[key] = obj[key] || "";
        } else if (Array.isArray(obj[key])) {
          cleaned[key] = obj[key].map(cleanObject);
        } else {
          cleaned[key] = obj[key];
        }
      } else {
        // For undefined values, set defaults based on field type
        if (key === 'name' || key === 'title' || key === 'description' || key === 'institution' ||
            key === 'company' || key === 'location' || key === 'url' || key === 'issuer') {
          cleaned[key] = "";
        }
      }
    });

    return cleaned;
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100 
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <motion.div 
      className="container mx-auto px-4 py-2 max-w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Form {...form}>
        <form
          ref={formRef}
          data-is-dirty="false"
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submit triggered");
            const formData = form.getValues();
            console.log("Form data:", formData);
            onSubmit(formData).catch(error => {
              console.error("Error submitting form:", error);
              toast({
                title: "Error",
                description: error.message || "Failed to save profile",
                variant: "destructive"
              });
            });
          }}
          className="space-y-8"
        >
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.2
            }}
          >
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-4 flex flex-wrap justify-start gap-2 border-b pb-2 w-full">
                <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Personal Info</TabsTrigger>
                <TabsTrigger value="education" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Education</TabsTrigger>
                <TabsTrigger value="experience" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Experience</TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Skills & Languages</TabsTrigger>
                <TabsTrigger value="certifications" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Certifications</TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Projects</TabsTrigger>
                <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Documents</TabsTrigger>
                <TabsTrigger value="additional" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Additional</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Personal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input type="tel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="portfolioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Portfolio URL</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} placeholder="https://yourportfolio.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Summary</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="min-h-[120px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Preferred Location</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g., Remote, New York, San Francisco" />
                              </FormControl>
                              <FormDescription>Where you prefer to work</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="education" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Education</CardTitle>
                      <CardDescription>Add your educational background</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {educationFields.map((field, index) => (
                        <div key={field.id} className="mb-8 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeEducation(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.institution`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Institution</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="University or school name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Degree</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Bachelor of Science" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.field`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field of Study</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Computer Science" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`education.${index}.gpa`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GPA</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., 3.8" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="month" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div>
                              <FormField
                                control={form.control}
                                name={`education.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="month" disabled={form.watch(`education.${index}.isPresent`)} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.isPresent`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={(checked) => {
                                          field.onChange(checked);
                                          if (checked) {
                                            form.setValue(`education.${index}.endDate`, "");
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>Currently studying here</FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendEducation({
                          institution: "",
                          degree: "",
                          field: "",
                          startDate: "",
                          endDate: "",
                          isPresent: false,
                          gpa: ""
                        })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Education
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="experience" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Experience</CardTitle>
                      <CardDescription>Add your work experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {experienceFields.map((field, index) => (
                        <div key={field.id} className="mb-8 p-4 border rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeExperience(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Company name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`experience.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Job title" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`experience.${index}.location`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Location</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="City, State or Remote" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`experience.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                      <Input {...field} type="month" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div>
                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.endDate`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>End Date</FormLabel>
                                      <FormControl>
                                        <Input {...field} type="month" disabled={form.watch(`experience.${index}.isPresent`)} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.isPresent`}
                                  render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value}
                                          onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) {
                                              form.setValue(`experience.${index}.endDate`, "");
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <div className="space-y-1 leading-none">
                                        <FormLabel>Currently working here</FormLabel>
                                      </div>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <FormField
                            control={form.control}
                            name={`experience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Describe your responsibilities and achievements" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => appendExperience({
                          company: "",
                          title: "",
                          location: "",
                          startDate: "",
                          endDate: "",
                          isPresent: false,
                          description: ""
                        })}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Experience
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="skills" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Skills & Languages</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <FormLabel>Skills</FormLabel>
                        <div className="flex flex-wrap gap-2 mt-2 mb-4">
                          {form.watch("skills")?.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                              {typeof skill === 'string' ? skill : JSON.stringify(skill)}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-2"
                                onClick={() => typeof skill === 'string' && handleRemoveSkill(skill)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            placeholder="Add a skill (e.g., JavaScript, Project Management)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddSkill}>Add</Button>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <FormLabel className="text-base">Languages</FormLabel>
                          <div className="flex gap-2">
                            <Input
                              value={languageInput}
                              onChange={(e) => setLanguageInput(e.target.value)}
                              placeholder="Language name"
                              className="w-48"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddLanguage();
                                }
                              }}
                            />
                            <Button type="button" onClick={handleAddLanguage}>Add</Button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {languageFields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-4 p-3 border rounded-lg">
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`languages.${index}.name`}
                                  render={({ field }) => (
                                    <div className="font-medium">{field.value}</div>
                                  )}
                                />
                              </div>

                              <FormField
                                control={form.control}
                                name={`languages.${index}.proficiency`}
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select proficiency" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Basic">Basic</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                        <SelectItem value="Native">Native</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLanguage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="certifications" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Professional Certifications</CardTitle>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendCertification({
                            name: "",
                            issuer: "",
                            issueDate: "",
                            expiryDate: "",
                            credentialId: "",
                            credentialUrl: ""
                          })}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <Award className="h-4 w-4 mr-2" />
                          Add Certification
                        </Button>
                      </CardHeader>

                      {certificationFields.map((field, index) => (
                        <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => removeCertification(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`certifications.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Certification Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.issuer`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Issuing Organization</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.credentialId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credential ID</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.credentialUrl`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credential URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="url" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.issueDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Issue Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`certifications.${index}.expiryDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date (if applicable)</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="projects" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Projects</CardTitle>
                      <CardDescription>
                        Add details about your projects
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {projectFields.map((field, index) => (
                        <div key={field.id} className="border p-4 rounded-md relative">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => removeProject(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <FormField
                              control={form.control}
                              name={`projects.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Project name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`projects.${index}.url`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Project URL</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="https://" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`projects.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="Describe your project" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          appendProject({
                            title: "",
                            url: "",
                            description: ""
                          });
                          // Mark form as dirty when adding a new project
                          if (formRef.current) {
                            formRef.current.dataset.isDirty = 'true';
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Project
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="documents" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Documents & Links</CardTitle>
                      <CardDescription>
                        Upload your documents and add your professional links
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Documents</h3>
                          <FormItem>
                            <FormLabel>Resume (PDF only)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFileState(prev => ({ ...prev, resume: file }));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload your current resume (max 5MB)
                            </FormDescription>
                            {profile?.resumeUrl && !profile.resumeUrl.startsWith('blob:') && (
                              <div className="mt-2">
                                <a
                                  href={profile.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                >
                                  View Current Resume
                                </a>
                              </div>
                            )}
                          </FormItem>

                          <FormItem>
                            <FormLabel>Transcript (PDF only)</FormLabel>
                            <FormControl>
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setFileState(prev => ({ ...prev, transcript: file }));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Upload your academic transcript (max 5MB)
                            </FormDescription>
                            {profile?.transcriptUrl && !profile.transcriptUrl.startsWith('blob:') && (
                              <div className="mt-2">
                                <a
                                  href={profile.transcriptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                                >
                                  View Current Transcript
                                </a>
                              </div>
                            )}
                          </FormItem>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Professional Links</h3>
                          <FormField
                            control={form.control}
                            name="linkedinUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>LinkedIn URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://linkedin.com/in/username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="githubUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GitHub URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://github.com/username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="portfolioUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Portfolio URL</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} placeholder="https://yourportfolio.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              <TabsContent value="additional" className="mt-2">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100,
                    delay: 0.2
                  }}
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                      <CardDescription>
                        Provide additional details about your work preferences and availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="workAuthorization"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Authorization</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select work authorization" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="US Citizen">US Citizen</SelectItem>
                                  <SelectItem value="Green Card">Green Card</SelectItem>
                                  <SelectItem value="H1B">H1B</SelectItem>
                                  <SelectItem value="F1 OPT">F1 OPT</SelectItem>
                                  <SelectItem value="TN Visa">TN Visa</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="availability"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Availability</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select availability" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Immediate">Immediate</SelectItem>
                                  <SelectItem value="2 Weeks">2 Weeks</SelectItem>
                                  <SelectItem value="1 Month">1 Month</SelectItem>
                                  <SelectItem value="3 Months">3 Months</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="citizenshipStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Citizenship Status</FormLabel>
                              <FormControl>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select citizenship status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="US Citizen">US Citizen</SelectItem>
                                    <SelectItem value="Permanent Resident">Permanent Resident</SelectItem>
                                    <SelectItem value="Non-Resident">Non-Resident</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="visaSponsorship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Need Visa Sponsorship</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "true")}
                                value={field.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="willingToRelocate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Willing to Relocate</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(value === "true")}
                                value={field.value ? "true" : "false"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="true">Yes</SelectItem>
                                  <SelectItem value="false">No</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="salaryExpectation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salary Expectation</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  value={field.value || ''} 
                                  placeholder="e.g., $80,000 - $100,000" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* Single submit button for the entire form */}
          <motion.div 
            className="flex justify-end mt-6 pb-8"
            variants={itemVariants}
          >
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="min-w-[120px]"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </motion.div>
  );
}