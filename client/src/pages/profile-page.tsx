import { useQuery } from "@tanstack/react-query";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useMemo, useCallback, useState } from 'react';
import { ApplicationCreditsCard } from "@/components/ApplicationCreditsCard";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Calendar, Award, Globe, Code } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
        userId: userId
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
      userId: userId
    };
  }
};

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [debugMsg, setDebugMsg] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");

  // Update the query to use fetchOrCreateProfile
  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("No user ID");
      return fetchOrCreateProfile(user.id);
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache
  });

  const form = useForm<InsertProfile>({
    resolver: zodResolver(insertProfileSchema),
    defaultValues: profile || {
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
      citizenshipStatus: "US Citizen"
    }
  });

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

  // Make sure form is updated when profile data changes
  useEffect(() => {
    if (profile) {
      console.log("Resetting form with profile:", profile); // Debug log
      
      // Ensure all array fields are properly initialized
      const formattedProfile = {
        ...profile,
        education: profile.education || [],
        experience: profile.experience || [],
        skills: profile.skills || [],
        certifications: profile.certifications || [],
        languages: profile.languages || [],
        publications: profile.publications || [],
        projects: profile.projects || [],
        // Ensure boolean fields are properly initialized
        visaSponsorship: profile.visaSponsorship === true,
        willingToRelocate: profile.willingToRelocate === true
      };
      
      form.reset(formattedProfile);
    }
  }, [profile, form]);

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
  const handleRemoveSkill = useCallback((skill: string) => {
    const currentSkills = form.getValues("skills") || [];
    form.setValue("skills", currentSkills.filter(s => s !== skill));
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

  // Update the onSubmit function to handle validation errors gracefully
  const onSubmit = async (data: InsertProfile) => {
    try {
      setDebugMsg("Submitting form...");
      console.log("Form data being submitted:", data);
      
      if (!user?.id) {
        throw new Error("No user ID");
      }
      
      // Ensure userId is set
      data.userId = user.id;
      
      // Ensure all array fields are properly initialized
      data.education = data.education || [];
      data.experience = data.experience || [];
      data.skills = data.skills || [];
      data.certifications = data.certifications || [];
      data.languages = data.languages || [];
      data.publications = data.publications || [];
      data.projects = data.projects || [];
      
      // Ensure boolean fields are properly set
      data.visaSponsorship = data.visaSponsorship === true;
      data.willingToRelocate = data.willingToRelocate === true;
      
      // Ensure all required string fields have at least empty string values
      data.name = data.name || "";
      data.email = data.email || "";
      data.phone = data.phone || "";
      data.title = data.title || "";
      data.bio = data.bio || "";
      data.location = data.location || "";
      data.address = data.address || "";
      data.city = data.city || "";
      data.state = data.state || "";
      data.zipCode = data.zipCode || "";
      data.country = data.country || "";
      data.workAuthorization = data.workAuthorization || "US Citizen";
      data.availability = data.availability || "2 Weeks";
      data.citizenshipStatus = data.citizenshipStatus || "US Citizen";
      
      // Log the request details
      console.log("Sending request to /api/profiles with data:", JSON.stringify(data));
      
      const response = await apiRequest("POST", "/api/profiles", data);
      console.log("Response status:", response.status);
      
      // Try to get response body regardless of status
      let responseBody;
      try {
        responseBody = await response.json();
        console.log("Response body:", responseBody);
      } catch (e) {
        console.log("Could not parse response as JSON");
      }
      
      if (!response.ok) {
        throw new Error(responseBody?.message || `Failed to save profile: ${response.status}`);
      }
      
      // Invalidate the profile query to refresh data
      queryClient.invalidateQueries(["profile", user.id]);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setDebugMsg("Form submitted successfully");
      
      // Reset form state to mark it as pristine, but don't trigger revalidation
      form.reset(data, { keepValues: true, keepDirty: false });
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
      setDebugMsg(`Error: ${error.message}`);
    }
  };

  // Update the handleDirectSave function to bypass validation errors
  const handleDirectSave = () => {
    console.log("Direct save button clicked");
    console.log("Current form values:", form.getValues());
    console.log("Form state:", form.formState);
    
    // Get current form values
    const formData = form.getValues();
    
    // Log validation errors
    if (Object.keys(form.formState.errors).length > 0) {
      console.warn("Form has validation errors:", form.formState.errors);
    }
    
    // Bypass the form validation and submit directly
    submitProfileData(formData);
  };

  // Add this function to handle direct submission without validation
  const submitProfileData = async (data: any) => {
    try {
      setDebugMsg("Submitting form data directly...");
      console.log("Form data being submitted directly:", data);
      
      if (!user?.id) {
        throw new Error("No user ID");
      }
      
      // Ensure userId is set
      data.userId = user.id;
      
      // Ensure all array fields are properly initialized and formatted
      data.education = Array.isArray(data.education) ? data.education.map(cleanObject) : [];
      data.experience = Array.isArray(data.experience) ? data.experience.map(cleanObject) : [];
      data.skills = Array.isArray(data.skills) ? data.skills.map(cleanObject) : [];
      data.certifications = Array.isArray(data.certifications) ? data.certifications.map(cleanObject) : [];
      data.languages = Array.isArray(data.languages) ? data.languages.map(cleanObject) : [];
      data.publications = Array.isArray(data.publications) ? data.publications.map(cleanObject) : [];
      data.projects = Array.isArray(data.projects) ? data.projects.map(cleanObject) : [];
      
      // Ensure boolean fields are properly set
      data.visaSponsorship = data.visaSponsorship === true || data.visaSponsorship === "true";
      data.willingToRelocate = data.willingToRelocate === true || data.willingToRelocate === "true";
      
      // Ensure all required string fields have at least empty string values
      data.name = data.name || "";
      data.email = data.email || "";
      data.phone = data.phone || "";
      data.title = data.title || "";
      data.bio = data.bio || "";
      data.location = data.location || "";
      data.address = data.address || "";
      data.city = data.city || "";
      data.state = data.state || "";
      data.zipCode = data.zipCode || "";
      data.country = data.country || "";
      data.workAuthorization = data.workAuthorization || "US Citizen";
      data.availability = data.availability || "2 Weeks";
      data.citizenshipStatus = data.citizenshipStatus || "US Citizen";
      
      // Log the request details
      console.log("Sending request to /api/profiles with data:", JSON.stringify(data));
      
      const response = await apiRequest("POST", "/api/profiles", data);
      console.log("Response status:", response.status);
      
      // Try to get response body regardless of status
      let responseBody;
      try {
        responseBody = await response.json();
        console.log("Response body:", responseBody);
      } catch (e) {
        console.log("Could not parse response as JSON");
      }
      
      if (!response.ok) {
        throw new Error(responseBody?.message || `Failed to save profile: ${response.status}`);
      }
      
      // Invalidate the profile query to refresh data
      queryClient.invalidateQueries(["profile", user.id]);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      setDebugMsg("Form submitted successfully");
      
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
      setDebugMsg(`Error: ${error.message}`);
    }
  };

  // Helper function to clean objects by removing undefined values and ensuring proper types
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="personal">
            <TabsList className="mb-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="skills">Skills & Languages</TabsTrigger>
              <TabsTrigger value="certifications">Certifications</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Professional Summary</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
            </TabsContent>

            <TabsContent value="education">
              <Card>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            </TabsContent>

            <TabsContent value="experience">
              <Card>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </TabsContent>

            <TabsContent value="skills">
              <Card>
                <CardHeader>
                  <CardTitle>Skills & Languages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <FormLabel>Skills</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2 mb-4">
                      {form.watch("skills")?.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 text-sm">
                          {skill}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2"
                            onClick={() => handleRemoveSkill(skill)}
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
            </TabsContent>

            <TabsContent value="certifications">
              <Card>
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </TabsContent>

            <TabsContent value="projects">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>Add your projects</CardDescription>
                </CardHeader>
                <CardContent>
                  {projectFields.map((field, index) => (
                    <div key={field.id} className="mb-8 p-4 border rounded-md relative">
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
                          name={`projects.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
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
                                <Input {...field} placeholder="https://..." />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name={`projects.${index}.startDate`}
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
                        
                        <FormField
                          control={form.control}
                          name={`projects.${index}.endDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="month" disabled={form.watch(`projects.${index}.isPresent`)} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`projects.${index}.isPresent`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    // Clear end date if "Present" is checked
                                    if (checked) {
                                      form.setValue(`projects.${index}.endDate`, "");
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Currently working on this project</FormLabel>
                              </div>
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
                              <Textarea {...field} placeholder="Describe the project and your role" />
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
                    onClick={() => appendProject({
                      name: "",
                      description: "",
                      url: "",
                      startDate: "",
                      endDate: "",
                      isPresent: false
                    })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Project
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>
                    Upload your resume, transcript, and other documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="resumeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resume</FormLabel>
                          <FormControl>
                            <div className="flex gap-4 items-center">
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    field.onChange(URL.createObjectURL(file));
                                  }
                                }}
                              />
                              {field.value && (
                                <a
                                  href={field.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline"
                                >
                                  View Current Resume
                                </a>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload your resume in PDF, DOC, or DOCX format (max 5MB)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transcriptUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Academic Transcript</FormLabel>
                          <FormControl>
                            <div className="flex gap-4 items-center">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    field.onChange(URL.createObjectURL(file));
                                  }
                                }}
                              />
                              {field.value && (
                                <a
                                  href={field.value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-500 hover:underline"
                                >
                                  View Current Transcript
                                </a>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Upload your academic transcript in PDF format (max 5MB)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <Input {...field} placeholder="e.g., $80,000 - $100,000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          {/* Single submit button for the entire form */}
          <div className="flex justify-end mt-6">
            <Button
              type="button"
              onClick={handleDirectSave}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}