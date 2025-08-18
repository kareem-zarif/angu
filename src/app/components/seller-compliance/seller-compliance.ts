import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SellerComplianceService, ComplianceReport, ComplianceViolation, ProductCompliance, CompliancePolicy } from '../../services/seller-compliance.service';
import { ProductService } from '../../services/product-service';
import { SellerOrdersService } from '../../services/seller-orders.service';
import { Auth } from '../../services/auth';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface ComplianceStats {
  totalProducts: number;
  compliantProducts: number;
  nonCompliantProducts: number;
  pendingReviewProducts: number;
  criticalViolations: number;
  warnings: number;
  infoViolations: number;
  complianceScore: number;
  lastAuditDate: string;
  productsByStatus: { status: string; count: number }[];
  violationsByType: { type: string; count: number }[];
}

export interface ProductComplianceSummary {
  productId: string;
  productName: string;
  approvalStatus: number;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
  violations: ComplianceViolation[];
  complianceScore: number;
  lastChecked: string;
  stockLevel: number;
  price: number;
  category: string;
}

@Component({
  selector: 'app-seller-compliance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './seller-compliance.html',
  styleUrl: './seller-compliance.css'
})
export class SellerComplianceComponent implements OnInit {
  
  // Data properties
  complianceStats: ComplianceStats = {
    totalProducts: 0,
    compliantProducts: 0,
    nonCompliantProducts: 0,
    pendingReviewProducts: 0,
    criticalViolations: 0,
    warnings: 0,
    infoViolations: 0,
    complianceScore: 0,
    lastAuditDate: new Date().toISOString(),
    productsByStatus: [],
    violationsByType: []
  };

  productComplianceList: ProductComplianceSummary[] = [];
  complianceViolations: ComplianceViolation[] = [];
  compliancePolicies: CompliancePolicy[] = [];
  
  // Filter properties
  statusFilter = 'all';
  severityFilter = 'all';
  categoryFilter = 'all';
  searchTerm = '';
  
  // UI state
  isLoading = false;
  isRunningCheck = false;
  selectedProduct: ProductComplianceSummary | null = null;
  showViolationDetails = false;
  selectedViolation: ComplianceViolation | null = null;

  constructor(
    private sellerComplianceService: SellerComplianceService,
    private productService: ProductService,
    private sellerOrdersService: SellerOrdersService,
    private auth: Auth
  ) {}

  ngOnInit() {
    this.loadComplianceData();
  }

  loadComplianceData() {
    this.isLoading = true;

    // Load all data in parallel
    forkJoin({
      products: this.productService.getAllForSeller(),
      violations: this.sellerComplianceService.getComplianceViolations(),
      policies: this.sellerComplianceService.getCompliancePolicies(),
      report: this.sellerComplianceService.getComplianceReport().pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: (data) => {
        this.processComplianceData(data.products, data.violations, data.policies, data.report);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading compliance data:', error);
        this.isLoading = false;
      }
    });
  }

  private processComplianceData(products: any[], violations: ComplianceViolation[], policies: CompliancePolicy[], report: ComplianceReport | null) {
    // Process products and create compliance summaries
    this.productComplianceList = products.map(product => {
      const productViolations = violations.filter(v => v.productId === product.id);
      const complianceScore = this.calculateComplianceScore(product, productViolations);
      
      return {
        productId: product.id,
        productName: product.name,
        approvalStatus: product.approvalStatus,
        complianceStatus: this.determineComplianceStatus(product, productViolations),
        violations: productViolations,
        complianceScore,
        lastChecked: new Date().toISOString(),
        stockLevel: product.noINStock,
        price: product.pricePerPiece,
        category: product.subCategoryId || 'Unknown'
      };
    });

    // Calculate compliance statistics
    this.calculateComplianceStats();
    
    // Store violations and policies
    this.complianceViolations = violations;
    this.compliancePolicies = policies;
  }

  private calculateComplianceScore(product: any, violations: ComplianceViolation[]): number {
    let score = 100;
    
    // Deduct points for violations
    violations.forEach(violation => {
      switch (violation.violationType) {
        case 'critical':
          score -= 20;
          break;
        case 'warning':
          score -= 10;
          break;
        case 'info':
          score -= 5;
          break;
      }
    });

    // Deduct points for approval status
    if (product.approvalStatus === 1) { // Pending
      score -= 15;
    } else if (product.approvalStatus === 3) { // Rejected
      score -= 30;
    }

    // Deduct points for low stock
    if (product.noINStock < 5) {
      score -= 10;
    }

    return Math.max(0, score);
  }

  private determineComplianceStatus(product: any, violations: ComplianceViolation[]): 'compliant' | 'non_compliant' | 'pending_review' {
    const criticalViolations = violations.filter(v => v.violationType === 'critical');
    
    if (product.approvalStatus === 1) {
      return 'pending_review';
    } else if (product.approvalStatus === 3 || criticalViolations.length > 0) {
      return 'non_compliant';
    } else {
      return 'compliant';
    }
  }

  private calculateComplianceStats() {
    const totalProducts = this.productComplianceList.length;
    const compliantProducts = this.productComplianceList.filter(p => p.complianceStatus === 'compliant').length;
    const nonCompliantProducts = this.productComplianceList.filter(p => p.complianceStatus === 'non_compliant').length;
    const pendingReviewProducts = this.productComplianceList.filter(p => p.complianceStatus === 'pending_review').length;

    const criticalViolations = this.complianceViolations.filter(v => v.violationType === 'critical').length;
    const warnings = this.complianceViolations.filter(v => v.violationType === 'warning').length;
    const infoViolations = this.complianceViolations.filter(v => v.violationType === 'info').length;

    const totalScore = this.productComplianceList.reduce((sum, product) => sum + product.complianceScore, 0);
    const averageScore = totalProducts > 0 ? Math.round(totalScore / totalProducts) : 0;

    // Group products by status
    const productsByStatus = [
      { status: 'Compliant', count: compliantProducts },
      { status: 'Non-Compliant', count: nonCompliantProducts },
      { status: 'Pending Review', count: pendingReviewProducts }
    ];

    // Group violations by type
    const violationsByType = [
      { type: 'Critical', count: criticalViolations },
      { type: 'Warning', count: warnings },
      { type: 'Info', count: infoViolations }
    ];

    this.complianceStats = {
      totalProducts,
      compliantProducts,
      nonCompliantProducts,
      pendingReviewProducts,
      criticalViolations,
      warnings,
      infoViolations,
      complianceScore: averageScore,
      lastAuditDate: new Date().toISOString(),
      productsByStatus,
      violationsByType
    };
  }

  runComplianceCheck() {
    this.isRunningCheck = true;
    
    this.sellerComplianceService.runComplianceCheck().subscribe({
      next: (result) => {
        console.log('Compliance check completed:', result);
        this.loadComplianceData(); // Reload data after check
        this.isRunningCheck = false;
      },
      error: (error) => {
        console.error('Error running compliance check:', error);
        this.isRunningCheck = false;
      }
    });
  }

  resolveViolation(violation: ComplianceViolation) {
    const resolution = {
      resolutionNotes: 'Resolved by seller',
      resolutionDate: new Date().toISOString()
    };

    this.sellerComplianceService.resolveViolation(violation.id, resolution).subscribe({
      next: (updatedViolation) => {
        // Update local data
        const index = this.complianceViolations.findIndex(v => v.id === violation.id);
        if (index !== -1) {
          this.complianceViolations[index] = updatedViolation;
        }
        
        // Recalculate stats
        this.calculateComplianceStats();
      },
      error: (error) => {
        console.error('Error resolving violation:', error);
      }
    });
  }

  ignoreViolation(violation: ComplianceViolation) {
    const reason = 'Ignored by seller';
    
    this.sellerComplianceService.ignoreViolation(violation.id, reason).subscribe({
      next: (updatedViolation) => {
        // Update local data
        const index = this.complianceViolations.findIndex(v => v.id === violation.id);
        if (index !== -1) {
          this.complianceViolations[index] = updatedViolation;
        }
        
        // Recalculate stats
        this.calculateComplianceStats();
      },
      error: (error) => {
        console.error('Error ignoring violation:', error);
      }
    });
  }

  viewViolationDetails(violation: ComplianceViolation) {
    this.selectedViolation = violation;
    this.showViolationDetails = true;
  }

  closeViolationDetails() {
    this.selectedViolation = null;
    this.showViolationDetails = false;
  }

  getFilteredViolations(): ComplianceViolation[] {
    return this.complianceViolations.filter(violation => {
      const matchesStatus = this.statusFilter === 'all' || violation.status === this.statusFilter;
      const matchesSeverity = this.severityFilter === 'all' || violation.violationType === this.severityFilter;
      const matchesSearch = !this.searchTerm || 
        violation.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        violation.description.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }

  getFilteredProducts(): ProductComplianceSummary[] {
    return this.productComplianceList.filter(product => {
      const matchesStatus = this.statusFilter === 'all' || product.complianceStatus === this.statusFilter;
      const matchesSearch = !this.searchTerm || 
        product.productName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }

  getComplianceStatusClass(status: string): string {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'non_compliant':
        return 'bg-red-100 text-red-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getViolationTypeClass(type: string): string {
    switch (type) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getApprovalStatusClass(status: number): string {
    switch (status) {
      case 1: // Pending
        return 'bg-yellow-100 text-yellow-800';
      case 2: // Approved
        return 'bg-green-100 text-green-800';
      case 3: // Rejected
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getApprovalStatusLabel(status: number): string {
    switch (status) {
      case 1:
        return 'Pending';
      case 2:
        return 'Approved';
      case 3:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getComplianceScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getCriticalViolationsCount(violations: ComplianceViolation[]): number {
    return violations.filter(v => v.violationType === 'critical').length;
  }

  exportComplianceReport() {
    const filter = {
      status: this.statusFilter !== 'all' ? this.statusFilter : undefined,
      severity: this.severityFilter !== 'all' ? this.severityFilter : undefined
    };

    this.sellerComplianceService.exportComplianceReport(filter).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error exporting report:', error);
      }
    });
  }
} 