import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Profile, insertProfileSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect } from 'react';

export default function ProfilePage() {
  const { toast } = useToast();

  const form = useForm({
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
      citizenshipStatus: "",
      resumeUrl: "",
      transcriptUrl: "",
      referenceList: [],
      visaSponsorship: false,
      willingToRelocate: false,
      preferredLocations: [],
      salaryExpectation: "",
      veteranStatus: "",
      militaryBranch: "",
      militaryServiceDates: "",
      securityClearance: "",
      clearanceType: "",
      clearanceExpiry: ""
    },
  });

  const { fields: educationFields, append: appendEducation, remove: removeEducation } =
    useFieldArray({ control: form.control, name: "education" });

  const { fields: experienceFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({ control: form.control, name: "experience" });

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles/1"],
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const response = await apiRequest("PATCH", `/api/profiles/${profile?.id || 1}`, values);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Success",
        description: "Profile saved successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (profile) {
      try {
        const parsedProfile = {
          ...profile,
          education: Array.isArray(profile.education)
            ? profile.education.map(edu => {
                if (typeof edu === 'string') {
                  try {
                    return JSON.parse(edu);
                  } catch (e) {
                    console.error('Failed to parse education:', edu, e);
                    return {};
                  }
                }
                return edu;
              })
            : [],
          experience: Array.isArray(profile.experience)
            ? profile.experience.map(exp => {
                if (typeof exp === 'string') {
                  try {
                    return JSON.parse(exp);
                  } catch (e) {
                    console.error('Failed to parse experience:', exp, e);
                    return {};
                  }
                }
                return exp;
              })
            : [],
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
          languages: Array.isArray(profile.languages) ? profile.languages : [],
          publications: Array.isArray(profile.publications) ? profile.publications : [],
          projects: Array.isArray(profile.projects) ? profile.projects : [],
          referenceList: Array.isArray(profile.referenceList) ? profile.referenceList : []
        };

        form.reset(parsedProfile);
      } catch (error) {
        console.error('Error parsing profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [profile, form.reset, toast]);

  async function onSubmit(values: any) {
    await mutation.mutateAsync(values);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="additional">Additional Info</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="education" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Education</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendEducation({
                      school: "",
                      degree: "",
                      field: "",
                      startDate: "",
                      endDate: "",
                      gpa: "",
                      majorCourses: [],
                      honors: [],
                      activities: [],
                      transcriptUrl: null
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {educationFields.map((field, index) => (
                    <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeEducation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.school`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>School</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`education.${index}.field`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Field of Study</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`education.${index}.startDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`education.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="experience" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Work Experience</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendExperience({
                      company: "",
                      title: "",
                      location: "",
                      startDate: "",
                      endDate: "",
                      current: false,
                      description: "",
                      achievements: [],
                      technologiesUsed: [],
                      responsibilities: []
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {experienceFields.map((field, index) => (
                    <div key={field.id} className="space-y-4 p-4 border rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeExperience(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.company`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company</FormLabel>
                              <FormControl>
                                <Input {...field} />
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
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`experience.${index}.location`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`experience.${index}.startDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`experience.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`experience.${index}.description`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
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

            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
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

            <TabsContent value="additional" className="space-y-6">
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
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="min-w-[120px]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}