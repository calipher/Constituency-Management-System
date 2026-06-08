import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function MobileCapture() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [newCitizenData, setNewCitizenData] = useState({
    name: '',
    idNumber: '',
    email: '',
    ward: '',
    phone: '',
    status: 'Registered Voter'
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitizenData.name || !newCitizenData.idNumber || !newCitizenData.ward) {
      alert("Please fill out Name, ID Number, and Ward.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'citizens'), {
        ...newCitizenData,
        lastContact: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setNewCitizenData({
        name: '',
        idNumber: '',
        email: '',
        ward: '',
        phone: '',
        status: 'Registered Voter'
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error adding citizen:", error);
      alert("Failed to save citizen details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-8 px-4 pb-24">
      {/* App Header */}
      <header className="flex items-center justify-between py-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Citizen Capture</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-1 max-w-md w-full mx-auto space-y-6">
        {/* Manual Edit Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form id="capture-form" onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  value={newCitizenData.name} 
                  onChange={(e) => setNewCitizenData({...newCitizenData, name: e.target.value})} 
                  placeholder="e.g. John Doe"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input 
                  id="idNumber" 
                  value={newCitizenData.idNumber} 
                  onChange={(e) => setNewCitizenData({...newCitizenData, idNumber: e.target.value})} 
                  placeholder="National ID"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    type="tel"
                    value={newCitizenData.phone} 
                    onChange={(e) => setNewCitizenData({...newCitizenData, phone: e.target.value})} 
                    placeholder="07XX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward *</Label>
                  <Input 
                    id="ward" 
                    value={newCitizenData.ward} 
                    onChange={(e) => setNewCitizenData({...newCitizenData, ward: e.target.value})} 
                    placeholder="e.g. Ward 22"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={newCitizenData.email} 
                  onChange={(e) => setNewCitizenData({...newCitizenData, email: e.target.value})} 
                  placeholder="john@example.com"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Floating Action Button for Save */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="max-w-md mx-auto relative">
          {success && (
            <div className="absolute -top-14 left-0 right-0 flex items-center justify-center gap-2 bg-emerald-500 text-white p-2 rounded-lg shadow-lg animate-in slide-in-from-bottom-2 fade-in">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Citizen saved successfully!</span>
            </div>
          )}
          <Button 
            type="submit" 
            form="capture-form" 
            size="lg" 
            disabled={isSubmitting}
            className="w-full h-14 text-lg font-semibold shadow-lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Save className="h-6 w-6 mr-2" />
            )}
            Save Citizen Record
          </Button>
        </div>
      </div>
    </div>
  );
}
